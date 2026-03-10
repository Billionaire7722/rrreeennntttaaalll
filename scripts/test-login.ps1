$body = @{
    loginId = "superadmin@local.test"
    password = "Admin@123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -ContentType "application/json" -Body $body
$response | ConvertTo-Json
