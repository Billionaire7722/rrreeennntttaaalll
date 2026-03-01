import paramiko
import sys

# SSH connection details
hostname = '103.200.22.111'
username = 'root'
password = 'nWHPWNL11RW1H647cs72lgCG'

# Commands to execute
commands = [
    'cd /root/rrreeennntttaaalll',
    'git fetch --all',
    'git checkout main',
    'git pull origin main',
    'docker-compose ps',
    'docker-compose build --no-cache',
    'docker-compose up -d',
    'docker-compose ps'
]

def run_ssh_commands():
    try:
        # Create SSH client
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Connect to the server
        print(f"Connecting to {hostname}...")
        client.connect(hostname, username=username, password=password)
        print("Connected successfully!")
        
        # Execute commands
        for cmd in commands:
            print(f"\n>>> Executing: {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            
            # Get output
            output = stdout.read().decode('utf-8')
            error = stderr.read().decode('utf-8')
            
            if output:
                print(output)
            if error:
                print(f"ERROR: {error}")
        
        # Close connection
        client.close()
        print("\nDeployment completed!")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_ssh_commands()
