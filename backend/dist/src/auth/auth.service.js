"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const roles_enum_1 = require("../security/roles.enum");
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 12;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;
let AuthService = class AuthService {
    prisma;
    jwtService;
    MAX_LOGIN_ATTEMPTS = 5;
    LOCK_DURATION_MINUTES = 15;
    TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async verifyCaptchaToken(captchaToken) {
        if (process.env.NODE_ENV === 'development') {
            return;
        }
        const secretKey = process.env.TURNSTILE_SECRET_KEY;
        if (!secretKey || !captchaToken) {
            throw new common_1.BadRequestException('Captcha verification failed');
        }
        const formBody = new URLSearchParams({
            secret: secretKey,
            response: captchaToken,
        });
        let verificationResponse;
        try {
            verificationResponse = await fetch(this.TURNSTILE_VERIFY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formBody,
            });
        }
        catch {
            throw new common_1.BadRequestException('Captcha verification failed');
        }
        if (!verificationResponse.ok) {
            throw new common_1.BadRequestException('Captcha verification failed');
        }
        const verificationResult = await verificationResponse.json();
        if (!verificationResult.success) {
            throw new common_1.BadRequestException('Captcha verification failed');
        }
    }
    validatePassword(password) {
        const errors = [];
        if (password.length < PASSWORD_MIN_LENGTH) {
            errors.push(`Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`);
        }
        if (password.length > PASSWORD_MAX_LENGTH) {
            errors.push(`Mật khẩu không được quá ${PASSWORD_MAX_LENGTH} ký tự`);
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Mật khẩu phải có ít nhất một chữ hoa');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Mật khẩu phải có ít nhất một chữ thường');
        }
        if (!/\d/.test(password)) {
            errors.push('Mật khẩu phải có ít nhất một số');
        }
        if (!/[@$!%*?&]/.test(password)) {
            errors.push('Mật khẩu phải có ít nhất một ký tự đặc biệt (@$!%*?&)');
        }
        return errors;
    }
    async checkDuplicateUser(email, username) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: email.toLowerCase() },
                    { username: username.toLowerCase() }
                ]
            }
        });
        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return { field: 'email', message: 'Email này đã được đăng ký' };
            }
            if (existingUser.username === username.toLowerCase()) {
                return { field: 'username', message: 'Tên đăng nhập này đã được sử dụng' };
            }
        }
        return null;
    }
    async register(registerDto, ipAddress, userAgent) {
        await this.verifyCaptchaToken(registerDto.captchaToken);
        const passwordErrors = this.validatePassword(registerDto.password);
        if (passwordErrors.length > 0) {
            throw new common_1.BadRequestException({
                message: passwordErrors.join('. '),
                errors: passwordErrors
            });
        }
        if (registerDto.password !== registerDto.confirmPassword) {
            throw new common_1.ConflictException('Mật khẩu xác nhận không khớp');
        }
        const duplicateError = await this.checkDuplicateUser(registerDto.email, registerDto.username);
        if (duplicateError) {
            throw new common_1.ConflictException(duplicateError.message);
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const newUser = await this.prisma.user.create({
            data: {
                name: registerDto.name,
                username: registerDto.username.toLowerCase(),
                email: registerDto.email.toLowerCase(),
                phone: registerDto.phone,
                password: hashedPassword,
                role: roles_enum_1.Role.USER,
            },
        });
        await this.logLoginAttempt(newUser.id, newUser.role, true, ipAddress, userAgent);
        return this.generateToken(newUser);
    }
    async countRecentFailedAttempts(userId) {
        const fifteenMinutesAgo = new Date();
        fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - this.LOCK_DURATION_MINUTES);
        const failedAttempts = await this.prisma.loginLog.count({
            where: {
                userId,
                success: false,
                timestamp: {
                    gte: fifteenMinutesAgo
                }
            }
        });
        return failedAttempts;
    }
    async login(loginDto, ipAddress, userAgent) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: loginDto.loginId.toLowerCase() },
                    { username: loginDto.loginId.toLowerCase() }
                ]
            }
        });
        if (!user) {
            await this.logLoginAttempt(null, null, false, ipAddress, userAgent);
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
        }
        if (user.role === roles_enum_1.Role.USER) {
            await this.verifyCaptchaToken(loginDto.captchaToken);
        }
        if (user.status !== 'ACTIVE') {
            await this.logLoginAttempt(user.id, user.role, false, ipAddress, userAgent);
            throw new common_1.UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            await this.logLoginAttempt(user.id, user.role, false, ipAddress, userAgent);
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
        }
        await this.logLoginAttempt(user.id, user.role, true, ipAddress, userAgent);
        return this.generateToken(user);
    }
    async logLoginAttempt(userId, role, success, ipAddress, userAgent) {
        try {
            await this.prisma.loginLog.create({
                data: {
                    userId,
                    role,
                    success,
                    ipAddress: ipAddress || 'Unknown',
                    userAgent: userAgent || 'Unknown'
                }
            });
        }
        catch (e) {
            console.error('Failed to write login log', e);
        }
    }
    async mockupGoogleLogin(email, name) {
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
            user = await this.prisma.user.create({
                data: {
                    email,
                    name,
                    username: email.split('@')[0] + Math.floor(Math.random() * 1000),
                    password: randomPassword,
                    role: roles_enum_1.Role.USER
                }
            });
        }
        return this.generateToken(user);
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Email not found');
        }
        return { message: 'Password reset link sent to your email', mock_token: this.jwtService.sign({ sub: user.id, reset: true }, { expiresIn: '10m' }) };
    }
    generateToken(user) {
        const payload = {
            username: user.username,
            sub: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
            phone: user.phone,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map