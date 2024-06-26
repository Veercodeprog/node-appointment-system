require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const { logger } = require("./middleware/logEvents");
const errorHandler = require("./middleware/errorHandler");
const verifyJWT = require("./middleware/verifyJWT");
const cookieParser = require("cookie-parser");
const credentials = require("./middleware/credentials");
const mongoose = require("mongoose");
const connectDB = require("./config/dbConn");
const PORT = process.env.PORT || 3500;
const User = require("./model/User");
const Service = require("./model/Service");
const Booking = require("./model/Booking");
// Connect to MongoDB
connectDB();

// custom middleware logger
app.use(logger);

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

//serve static files
app.use("/", express.static(path.join(__dirname, "/public")));

// routes
app.use("/", require("./routes/root"));
app.use("/register", require("./routes/register"));
app.use("/auth", require("./routes/auth"));
app.use("/refresh", require("./routes/refresh"));
app.use("/logout", require("./routes/logout"));
//booking
app.post("/booking", async (req, res) => {
  const { serviceName, charges, appointmentDate, appointmentTime, createdBy } =
    req.body;

  try {
    // Create new booking
    const newBooking = new Booking({
      serviceName,
      charges,
      appointmentDate,
      appointmentTime,
      createdBy,
    });

    await newBooking.save();

    res
      .status(200)
      .json({ message: "Booking successful", booking: newBooking });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Failed to book appointment" });
  }
});
app.get("/booked-appointments", async (req, res) => {
  const { appointmentDate, serviceName } = req.query;
  console.log(appointmentDate, serviceName);

  try {
    let query = { appointmentDate };
    if (serviceName) {
      query.serviceName = serviceName;
    }
    const bookings = await Booking.find(query);
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Server error" });
  }
});
//my requests
app.get("/my-requests", async (req, res) => {
  const username = req.query.username; // Assuming you have middleware to get authenticated user
  console.log("username", username);
  try {
    const bookings = await Booking.find({
      createdBy: username,
    }).sort({
      createdAt: -1,
    });
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching my requests:", error);
    res.status(500).json({ message: "Failed to fetch bookings." });
  }
});
// Update booking status to approved

app.put("/:id/approve", async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: true },
      { new: true }
    );
    res.json(booking);
  } catch (error) {
    console.error("Error approving booking:", error);
    res.status(500).json({ message: "Failed to approve booking." });
  }
});
// Update booking status to approved
// Delete a booking
app.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await Booking.findByIdAndDelete(id);
    res.json({ message: "Booking deleted successfully." });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Failed to delete booking." });
  }
});

//get all services
app.get("/services", async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ message: "Server error" });
  }
});
//get all bookings
app.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// to change user role
app.put("/users/:id/role", async (req, res) => {
  const { id } = req.params;
  const { newRole, roleCode } = req.body;

  try {
    let updatedRoles = {};

    // Depending on your schema, you may want to update the roles object here
    if (newRole === "Admin") {
      updatedRoles = { Admin: roleCode };
    } else if (newRole === "Subadmin") {
      updatedRoles = { Subadmin: roleCode };
    } else if (newRole === "Customer") {
      updatedRoles = { Customer: roleCode };
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Update user's role object with new role
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { [`roles.${newRole}`]: roleCode } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error updating user role:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// Example route to delete a service
app.delete("/services/:id", async (req, res) => {
  const serviceId = req.params.id;
  try {
    const service = await Service.findByIdAndDelete(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/addservice", async (req, res) => {
  const { serviceName, charges } = req.body;

  try {
    // Create new service
    const newService = new Service({
      serviceName,
      charges,
      timingSlots: generateDefaultTimingSlots(),
    });

    // Save service to database
    await newService.save();

    res.status(201).json(newService);
  } catch (err) {
    console.error("Error creating service:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// PUT edit a service
app.put("/services/:id", async (req, res) => {
  const { id } = req.params;
  const { serviceName, charges } = req.body;

  try {
    const updatedService = await Service.findByIdAndUpdate(
      id,
      { serviceName, charges },
      { new: true }
    );

    if (!updatedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(updatedService);
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Function to generate default timing slots from Monday to Friday, 10 AM to 6 PM
function generateDefaultTimingSlots() {
  const slots = [];
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const startTime = 10; // 10 AM
  const endTime = 18; // 6 PM

  weekdays.forEach((day) => {
    for (let hour = startTime; hour < endTime; hour++) {
      slots.push({
        day: day,
        time: `${hour}:00 - ${hour + 1}:00`,
        available: true,
      });
    }
  });

  return slots;
}
app.put("/add/timingSlots/:serviceId", async (req, res) => {
  const { serviceId } = req.params;
  const { timingSlots } = req.body;

  try {
    // Update timingSlots for the service identified by serviceId
    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      { timingSlots },
      { new: true } // To return the updated document
    );

    if (!updatedService) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.status(200).json(updatedService.timingSlots); // Return updated timingSlots
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating timing slots" });
  }
});
app.use(verifyJWT); // verify JWT for all routes below this line
app.use("/employees", require("./routes/api/employees"));
app.use("/users", require("./routes/api/users"));

app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ error: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

// DELETE delete user

app.use(errorHandler);

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
