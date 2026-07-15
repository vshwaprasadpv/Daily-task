@echo off
echo =============================================
echo  Creative Task Manager - Database Setup
echo =============================================
echo.
echo Step 1: Make sure MySQL is running.
echo Step 2: Run this command to create the database:
echo.
echo   mysql -u root -p ^< sql\schema.sql
echo.
echo Step 3: Update your .env file with your MySQL password:
echo   Open: g:\Vishwa\creative-task-manager-nodejs\.env
echo   Set:  DB_PASS=your_mysql_password
echo.
echo Step 4: Start the server:
echo   npm start
echo.
echo Step 5: Open browser at: http://localhost:3000
echo.
echo =============================================
echo  Login Credentials (pre-loaded in DB)
echo =============================================
echo  Admin:        admin@creative.com   / Admin@123
echo  Designer:     priya@creative.com   / Admin@123
echo  Video Editor: rahul@creative.com   / Admin@123
echo =============================================
pause
