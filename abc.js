// app.post("/booking", express.json(), (req, res) => {
//   const { seatIds, name, phoneNumber } = req.body;

//   // Validate input
//   if (!Array.isArray(seatIds) || seatIds.length === 0) {
//     return res.status(400).json({ error: "Invalid seatIds" });
//   }
//   if (typeof name !== "string" || name.trim() === "") {
//     return res.status(400).json({ error: "Invalid name" });
//   }
//   if (typeof phoneNumber !== "string" || phoneNumber.trim() === "") {
//     return res.status(400).json({ error: "Invalid phoneNumber" });
//   }

//   // Check if seats are available
//   const [seatsResult] = db.query(
//     "SELECT * FROM student_seat WHERE student_id_seat IN (?) AND booking_id IS NULL",
//     [seatIds]
//   );
//   if (seatsResult.length !== seatIds.length) {
//     return res.status(400).json({ error: "Some seats are already booked" });
//   }

//   // Create booking
//   const [bookingResult] = db.query(
//     "INSERT INTO bookings (name, phone_number) VALUES (?, ?)",
//     [name, phoneNumber]
//   );
//   const bookingId = bookingResult.insertId;

//   // Update seats with booking id
//   db.query(
//     "UPDATE student_seat SET booking_id = ? WHERE student_id_seat IN (?)",
//     [bookingId, seatIds]
//   );

//   // Calculate total amount
//   const [totalAmountResult] = db.query(
//     `
//         SELECT SUM(price) AS total_amount
//         FROM (
//             SELECT
//                 CASE
//                     WHEN (SELECT COUNT(*) FROM student_seat WHERE seat_class = ss.seat_class AND booking_id IS NOT NULL) / (SELECT COUNT(*) FROM student_seat WHERE seat_class = ss.seat_class) < 0.4 THEN COALESCE(sp.min_price, sp.normal_price)
//                     WHEN (SELECT COUNT(*) FROM student_seat WHERE seat_class = ss.seat_class AND booking_id IS NOT NULL) / (SELECT COUNT(*) FROM student_seat WHERE seat_class = ss.seat_class) BETWEEN 0.4 AND 0.6 THEN COALESCE(sp.normal_price, sp.max_price)
//                     ELSE COALESCE(sp.max_price, sp.normal_price)
//                 END AS price
//             FROM student_seat ss
//             JOIN seat_pricing sp ON ss.seat_class = sp.seat_class
//             WHERE ss.student_id_seat IN (?)
//         ) t
//     `,
//     [seatIds]
//   );
//   const totalAmount = totalAmountResult[0].total_amount;

//   // Return booking details
//   res.json({
//     bookingId,
//     totalAmount,
//   });
// });

// app.post("/booking", function (req, res) {
//     const seats = req.body.seatIds;
//     const name = req.body.name;
//     const phone = req.body.phoneNumber;

//     // Check if seats are available
//     let query =
//       "SELECT * FROM student_seat WHERE seat_identifier IN (?) AND booking_id IS NOT NULL";
//     connection.query(query, [seats], function (error, results, fields) {
//       if (error) throw error;
//       if (results.length > 0) {
//         res
//           .status(400)
//           .send({ error: "Some of the selected seats are already booked." });
//       } else {
//         // Create booking
//         query = "INSERT INTO bookings (name, phone_number) VALUES (?, ?)";
//         connection.query(query, [name, phone], function (error, results, fields) {
//           if (error) throw error;
//           const bookingId = results.insertId;

//           // Update student_seat table
//           query =
//             //   "UPDATE student_seat SET booking_id = ? WHERE seat_identifier IN (?)";
//             `INSERT INTO student_seat (booking_id, seat_identifier,seat_class) VALUES (?, ?,'A')`;
//           connection.query(
//             query,
//             [bookingId, seats[0]],
//             function (error, results, fields) {
//               if (error) throw error;

//               // Calculate total amount
//               query = `SELECT SUM(seat_pricing.normal_price) as total FROM student_seat JOIN seat_pricing ON
//                  student_seat.seat_class = seat_pricing.seat_class WHERE student_seat.booking_id IN (?)`;
//               connection.query(
//                 query,
//                 [bookingId],
//                 function (error, results, fields) {
//                   console.log(results);
//                   if (error) throw error;
//                   const totalAmount = "$" + results[0].total + 263.73;
//                   console.log(totalAmount);
//                   res.send({ bookingId: bookingId, totalAmount: totalAmount });
//                 }
//               );
//             }
//           );
//         });
//       }
//     });
//   });
