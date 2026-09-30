```powershell
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$Command = $Arguments[0]
$Argument = $Arguments[1]

switch ($Command) {

    # Node.js commands
    "node" {
        if ($Argument -eq "version") {
            node --version
        }
        else {
            Write-Host "Usage: vtb node version"
        }
    }

    # npm commands
    "npm" {
        if ($Argument -eq "version") {
            npm --version
        }
        else {
            Write-Host "Usage: vtb npm version"
        }
    }

    # Docker commands
    "docker" {
        switch ($Argument) {

            "version" {
                docker --version
            }

            "up" {
                docker compose up -d
            }

            "down" {
                docker compose down
            }

            "ps" {
                docker compose ps
            }

            "logs" {
                docker compose logs -f
            }

            default {
                Write-Host ""
                Write-Host "Docker commands:" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "  vtb docker version  - Display Docker version"
                Write-Host "  vtb docker up       - Start Docker services"
                Write-Host "  vtb docker down     - Stop Docker services"
                Write-Host "  vtb docker ps       - Show running containers"
                Write-Host "  vtb docker logs     - Show Docker logs"
                Write-Host ""
            }
        }
    }

    # NestJS development server
    "dev" {
        npm run start:dev
    }

    # NestJS development server alias
    "start:dev" {
        npm run start:dev
    }

    # NestJS application build
    "build" {
        npm run build
    }

    # Project tests
    "test" {
        switch ($Argument) {

            "coverage" {
                npm run test:cov
            }

            default {
                npm run test
            }
        }
    }

    # Display the CLI help menu
    default {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "          VTB - Developer CLI           " -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host ""

        Write-Host "Node.js" -ForegroundColor Yellow
        Write-Host "  vtb node version   - Display Node.js version"
        Write-Host ""

        Write-Host "npm" -ForegroundColor Yellow
        Write-Host "  vtb npm version    - Display npm version"
        Write-Host ""

        Write-Host "Docker" -ForegroundColor Yellow
        Write-Host "  vtb docker version - Display Docker version"
        Write-Host "  vtb docker up      - Start Docker services"
        Write-Host "  vtb docker down    - Stop Docker services"
        Write-Host "  vtb docker ps      - Show running containers"
        Write-Host "  vtb docker logs    - Show Docker logs"
        Write-Host ""

        Write-Host "NestJS" -ForegroundColor Yellow
        Write-Host "  vtb dev            - Start development server"
        Write-Host "  vtb start:dev      - Start development server"
        Write-Host "  vtb build          - Build the application"
        Write-Host ""

        Write-Host "Tests" -ForegroundColor Yellow
        Write-Host "  vtb test           - Run tests"
        Write-Host "  vtb test coverage  - Run tests with coverage"
        Write-Host ""
    }
}
