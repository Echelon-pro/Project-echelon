@echo off
echo Copying project files to EC2...
scp -i "C:/Users/aliou/Downloads/echelon-key.pem" ^
    -r ^
    css ^
    js ^
    server ^
    *.html ^
    *.json ^
    .env ^
    ec2-user@13.60.113.249:~/echelon/
