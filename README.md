# URBS — University Resource Borrowing System

> A smart system for responsible borrowing and timely return of university resources.

---

## 📋 Problem Description

Universities maintain a wide range of shared resources — cameras, musical instruments, tools, sports equipment, and stationery — that students need for academic projects, events, and coursework. Managing these resources manually leads to several problems:

- **No centralized tracking** — Administrators rely on paper logs or spreadsheets, making it difficult to know what's available in real time.
- **Lost or overdue items** — Without automated reminders or status tracking, borrowed items are frequently returned late or not at all.
- **Inefficient approval workflows** — Students have no easy way to submit borrowing requests, and admins have no streamlined way to approve, reject, or monitor them.
- **Poor visibility** — Students can't easily browse what resources are available, where to collect them, or check the condition of items before borrowing.

These issues result in resource wastage, scheduling conflicts, and frustration for both students and university staff.

---

## 💡 Proposed Solution

**URBS (University Resource Borrowing System)** is a full-stack web application that digitizes and streamlines the entire resource borrowing lifecycle. It provides:

- A **RESTful API** backend for managing resources and borrowing records.
- A **responsive web dashboard** for students to browse resources, submit borrowing requests, and track their status.
- **Admin capabilities** to approve/reject requests, monitor overdue items, and manage the resource inventory.
- **Automatic quantity management** — available stock is reduced on approval and restored on return.
- **Overdue detection** — the system automatically flags approved borrowings that have passed their return deadline.

---

## ✨ Features

### For Students
- Browse all available campus resources with search and category filtering
- View detailed resource information (condition, location, availability)
- Submit borrowing requests with purpose and expected return date
- Track borrowing history and current request status

### For Administrators
- Full CRUD management of the resource inventory
- Approve or reject pending borrowing requests with admin notes
- Mark items as returned
- View and auto-detect overdue borrowings
- Monitor all borrowing records across the system

### System
- Automatic available quantity adjustment on approval and return
- Overdue auto-flagging when querying overdue endpoint
- Complete borrowing lifecycle tracking: `Pending → Approved → Returned` (or `Rejected` / `Overdue`)
- Responsive frontend interface with real-time API integration

---

## 🛠️ Technologies Used

| Technology   | Purpose                                      |
|-------------|----------------------------------------------|
| **Node.js**  | Server-side JavaScript runtime               |
| **Express.js** (v5) | Web framework for building the REST API |
| **MongoDB**  | NoSQL database for storing resources & borrowings |
| **Mongoose** (v9) | MongoDB object modeling and schema validation |
| **dotenv**   | Environment variable management              |
| **body-parser** | JSON request body parsing middleware      |
| **nodemon**  | Auto-restart dev server on file changes      |
| **HTML/CSS/JS** | Responsive frontend dashboard             |

---

## 🛣️ API Endpoints

### Resources — `/api/resources`

| Method   | Endpoint                         | Description                       |
|----------|----------------------------------|-----------------------------------|
| `POST`   | `/api/resources/add`             | Add a new resource to inventory   |
| `GET`    | `/api/resources/getall`          | Fetch all resources               |
| `GET`    | `/api/resources/get/:id`         | Fetch a single resource by ID     |
| `GET`    | `/api/resources/category/:category` | Fetch resources by category    |
| `PUT`    | `/api/resources/update/:id`      | Update resource details           |
| `DELETE` | `/api/resources/delete/:id`      | Remove a resource from inventory  |

### Borrowings — `/api/borrowings`

| Method   | Endpoint                            | Description                                    |
|----------|-------------------------------------|------------------------------------------------|
| `POST`   | `/api/borrowings/request`           | Student submits a borrowing request            |
| `GET`    | `/api/borrowings/getall`            | Admin fetches all borrowing records            |
| `GET`    | `/api/borrowings/student/:studentId`| Fetch all borrowings for a specific student    |
| `GET`    | `/api/borrowings/overdue`           | Fetch all overdue borrowings (auto-flags them) |
| `PUT`    | `/api/borrowings/approve/:id`       | Admin approves a pending request               |
| `PUT`    | `/api/borrowings/reject/:id`        | Admin rejects a pending request                |
| `PUT`    | `/api/borrowings/return/:id`        | Mark an item as returned                       |
| `DELETE` | `/api/borrowings/delete/:id`        | Delete a borrowing record                      |

### Example Requests

#### ➕ Add a Resource

```http
POST /api/resources/add
Content-Type: application/json
```

```json
{
  "name": "Canon EOS R50 Camera",
  "category": "Camera & AV Equipment",
  "description": "Mirrorless camera for photography projects",
  "totalQuantity": 5,
  "availableQuantity": 5,
  "condition": "Excellent",
  "location": "Media Lab, Room 204"
}
```

#### 📩 Submit a Borrowing Request

```http
POST /api/borrowings/request
Content-Type: application/json
```

```json
{
  "studentName": "Ashan Perera",
  "studentId": "S20210045",
  "studentEmail": "ashan@university.lk",
  "resourceId": "<resource_objectId>",
  "quantityBorrowed": 1,
  "expectedReturnDate": "2026-05-20T00:00:00.000Z",
  "purpose": "Final year project documentation"
}
```

#### ✅ Approve a Request (Admin)

```http
PUT /api/borrowings/approve/<borrowing_id>
Content-Type: application/json
```

```json
{
  "adminNotes": "Approved by Dr. Perera. Please collect from Media Lab."
}
```

#### 🔄 Return an Item

```http
PUT /api/borrowings/return/<borrowing_id>
Content-Type: application/json
```

```json
{
  "adminNotes": "Returned in good condition."
}
```

---

## ⚙️ Setup Instructions

### Prerequisites

- **Node.js** (v18 or higher) — [Download here](https://nodejs.org/)
- **MongoDB** — Local installation or a [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster
- **Git** (optional) — for cloning the repository

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/URBS.git
   cd URBS
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root (or edit the existing one):

   ```env
   PORT=8000
   MONGO_URL=mongodb://localhost:27017/urbs
   ```

   > Replace the `MONGO_URL` value with your MongoDB Atlas connection string if using a cloud database.

---

## 🚀 How to Run the Project

1. **Make sure MongoDB is running** (if using a local instance):

   ```bash
   mongod
   ```

2. **Start the development server**:

   ```bash
   npm start
   ```

3. **Access the application**:

   - **Frontend Dashboard**: Open [http://localhost:8000](http://localhost:8000) in your browser
   - **API Base URL**: `http://localhost:8000/api`

4. **Test the API** using tools like:
   - [Postman](https://www.postman.com/)
   - [Thunder Client](https://www.thunderclient.com/) (VS Code extension)
   - `curl` from the command line

   Example:
   ```bash
   curl http://localhost:8000/api/resources/getall
   ```

---

## 📁 Project Structure

```
URBS/
├── index.js                          # Entry point — Express app + MongoDB connection
├── .env                              # Environment variables (PORT, MONGO_URL)
├── package.json                      # Project metadata and dependencies
├── README.md                         # Project documentation
├── model/
│   ├── resourceModel.js              # Mongoose schema for campus resources
│   └── borrowingModel.js             # Mongoose schema for borrowing records
├── controller/
│   ├── resourceController.js         # CRUD logic for resources
│   └── borrowingController.js        # Borrowing request, approval, return logic
├── routes/
│   ├── resourceRoute.js              # /api/resources route definitions
│   └── borrowingRoute.js             # /api/borrowings route definitions
└── public/
    └── index.html                    # Frontend dashboard (served as static files)
```

---

## 🔄 Borrowing Lifecycle

```
Student submits request
        ↓
     [Pending]
      ↓     ↓
[Approved] [Rejected]
      ↓
(Past due date?) → [Overdue]
      ↓
  [Returned]
```

- **Approved** → available quantity is automatically reduced
- **Returned** → available quantity is automatically restored
- **GET `/api/borrowings/overdue`** → any approved items past their return date are auto-flagged as Overdue

---
