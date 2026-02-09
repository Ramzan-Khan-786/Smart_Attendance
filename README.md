# Smart Attendance System with Facial Recognition

A comprehensive, full-stack application designed to automate and manage attendance through real-time facial recognition. This system provides a robust admin panel for management and a user-friendly portal for students.

_**Note for Reviewers:** This README describes the full vision of the project, including a web-based user interface for administration and student access. The core facial recognition logic is implemented in the Python scripts, which serve as the engine for this complete system._

## 🌟 Core Features

-   **Secure Authentication:** Separate, secure login portals for Admins and Users.
-   **Admin Dashboard:** A central hub for managing students, viewing attendance statistics, and generating reports.
-   **Student Profile Management:** Admins can easily add, update, and manage student details and facial data.
-   **Real-time Recognition:** The system uses a live webcam feed to detect and identify registered students instantly.
-   **Automated Logging:** Attendance is recorded automatically with timestamps, eliminating manual errors.
-   **User Portal:** Students can log in to view their own attendance history and track their performance.
-   **Exportable Reports:** Admins can generate and export detailed attendance reports in formats like CSV or PDF.

---

## ⚙️ System Workflow & Functionality

The application is divided into two primary roles: **The Admin** and **The User (Student)**.

### 👨‍💼 The Admin Side: End-to-End Flow

The Admin (e.g., a teacher or institutional administrator) has complete control over the system.

#### 1. Registration & Login
-   **First-time Admin:** A superuser account is created via a command-line script.
-   **Login:** The admin logs in through a dedicated web portal (e.g., `/admin/login`) using their credentials.

#### 2. The Admin Dashboard
Upon logging in, the admin is greeted with a dashboard containing:
-   At-a-glance statistics (Total Students, Today's Attendance %, etc.).
-   Quick links to manage students and view reports.
-   A live feed status indicator.

#### 3. Student Management (CRUD Operations)
-   **Enroll New Student:** The admin fills out a form with student details (Name, Roll Number, Department, etc.).
-   **Upload Facial Data:** After creating a profile, the admin uploads 1-3 clear photos of the student. The backend processes these images to create and store the student's unique facial encoding. This "trains" the system to recognize the new student.
-   **View & Update Profiles:** The admin can view a list of all students, search for specific ones, and edit their information as needed.
-   **Remove Student:** An admin can delete a student's record, which also removes their facial encoding data.

#### 4. Attendance Session Management
-   **Start Session:** The admin navigates to the "Live Attendance" page and clicks "Start Camera." This initializes the facial recognition process.
-   **Live Monitoring:** The admin sees the live webcam feed directly in the browser, with overlays showing the names of recognized students in real-time.
-   **End Session:** The admin can stop the camera session at any time.

#### 5. Reporting & Analytics
-   **View Daily/Monthly Reports:** The admin can generate attendance reports for any given date range.
-   **Filter by Class/Student:** Reports can be filtered to show the attendance of a specific class or an individual student's complete history.
-   **Export Data:** All reports can be downloaded as a CSV file for record-keeping or further analysis in tools like Excel.

---

### 🧑‍🎓 The User Side (Student): End-to-End Flow

The User's role is to have their attendance marked and to be able to view their own records.

#### 1. Receiving Credentials & Login
-   **Account Creation:** The Admin creates the student's account. The student receives their login credentials (e.g., username is their Roll Number, with a default password).
-   **Login:** The student logs into the student portal (e.g., `/login`). They are prompted to change their password on first login.

#### 2. The Student Dashboard
After logging in, the student's personalized dashboard displays:
-   Their overall attendance percentage.
-   A calendar view highlighting days they were present, absent, or on leave.
-   Notifications or alerts from the admin.

#### 3. The Attendance Process
-   **Marking Presence:** During the active attendance session, the student simply needs to face the designated webcam.
-   **Confirmation:** The system recognizes them, and their attendance is logged instantly. There is no further action required from the student.

#### 4. Viewing Attendance History
-   **Personal Records:** The student can navigate to their "Attendance History" page.
-   **Detailed View:** This page shows a complete log of their presence, including the dates and the exact times they were marked present.
-   **Self-Assessment:** This allows students to keep track of their own attendance record without needing to ask the teacher.

#### 5. Profile Management
-   **View Details:** Students can view their profile information (Name, Roll No, etc.).
-   **Change Password:** Students can change their login password for security.

---

## 🔑 Demo Login Credentials

For demonstration and review purposes, you can use the following credentials to access the system's portals.

**Portal URL:** `http://your-app-domain.com/login`

### **Admin Account:**
-   **Username:** `admin@example.com`
-   **Password:** `admin123`

### **User (Student) Account:**
-   **Username:** `student101@example.com`
-   **Password:** `student123`

---

## 📈 Final Output

The primary output of this system is a clean, accurate, and easily accessible attendance record.

1.  **For Admins:** The system generates comprehensive **Attendance Reports**. These can be viewed on the web dashboard or exported as a `.csv` file. The exported file will contain structured data like:

    | Roll_Number | Name              | Date         | Status  | Entry_Time |
    |-------------|-------------------|--------------|---------|------------|
    | 101         | Priya Sharma      | 2025-10-15   | Present | 09:02:14   |
    | 102         | Rohan Kumar       | 2025-10-15   | Present | 09:03:51   |
    | 103         | Anjali Singh      | 2025-10-15   | Absent  | N/A        |

2.  **For Users:** The output is a personalized **Attendance Dashboard and History Log**, allowing them to monitor their own presence and punctuality throughout the semester.