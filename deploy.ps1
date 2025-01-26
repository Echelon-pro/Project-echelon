Write-Host "Creating deployment package..."
Compress-Archive -Path .\* -DestinationPath .\deploy.zip -Force

Write-Host "Uploading to server..."
$keyPath = "C:\Users\aliou\Downloads\echelon-key.pem"
$server = "ec2-user@13.60.113.249"

# Upload the zip file
scp -i $keyPath .\deploy.zip ${server}:~/deploy.zip

# Execute deployment commands on server
$deployCommands = @"
cd ~
pm2 stop all
rm -rf echelon/*
unzip -o deploy.zip -d echelon/
rm deploy.zip
cd echelon
npm install
pm2 restart all
"@

ssh -i $keyPath $server $deployCommands

Write-Host "Cleaning up local files..."
Remove-Item .\deploy.zip

Write-Host "Deployment complete!"
