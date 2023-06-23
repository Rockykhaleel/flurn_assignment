const mysql = require("mysql");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.json());

const port = process.env.port || 3000;

var db = mysql.createConnection({
  //db details
});

db.connect((err) => {
  if (err) {
    throw err;
  } else {
    console.log("Connected!!");
  }
});

app.get("/seats", (req, res) => {
  db.query(
    "select * from student_seat order by seat_class",
    (err, result, field) => {
      if (err) {
        return console.log(err);
      }
      res.send(result);
    }
  );
});

app.get("/seats/:id", (req, res) => {
  const seatId = req.params.id;

  db.query(
    "SELECT * FROM student_seat WHERE student_id_seat = ?",
    [seatId],
    (err, seatResult) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (seatResult.length === 0) {
        return res.status(404).json({ error: "Seat not found" });
      }
      const seat = seatResult[0];

      db.query(
        "SELECT COUNT(DISTINCT seat_identifier) AS count FROM student_seat",
        (err, totalSeatsResult) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          const totalSeats = totalSeatsResult[0].count;
          db.query(
            "SELECT COUNT(DISTINCT seat_identifier) AS count FROM student_seat WHERE seat_class = ?",
            [seat.seat_class],
            (err, bookedSeatsResult) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              const bookedSeats = bookedSeatsResult[0].count;
              const percentageBooked = bookedSeats / totalSeats;

              db.query(
                "SELECT * FROM seat_pricing WHERE seat_class = ?",
                [seat.seat_class],
                (err, seatPricingResult) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                  if (seatPricingResult.length === 0) {
                    return res
                      .status(404)
                      .json({ error: "Seat pricing not found" });
                  }
                  const seatPricing = seatPricingResult[0];

                  let price;
                  if (percentageBooked < 0.4) {
                    price = seatPricing.min_price || seatPricing.normal_price;
                  } else if (percentageBooked <= 0.6) {
                    price = seatPricing.normal_price || seatPricing.max_price;
                  } else {
                    price = seatPricing.max_price || seatPricing.normal_price;
                  }

                  res.json({
                    seat_identifier: seat.seat_identifier,
                    seat_class: seat.seat_class,
                    price: price,
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

app.post("/booking", (req, res) => {
  const seats = req.body.seatIds;
  const name = req.body.name;
  const phone = req.body.phoneNumber;

  let query =
    "SELECT * FROM student_seat WHERE seat_identifier IN (?) AND booking_id IS NOT NULL";
  db.query(query, [seats], function (error, results, fields) {
    if (error) throw error;
    if (results.length > 0) {
      res
        .status(400)
        .send({ error: "Some of the selected seats are already booked." });
    } else {
      query = "INSERT INTO bookings (name, phone_number) VALUES (?, ?)";
      db.query(query, [name, phone], function (error, results, fields) {
        if (error) throw error;
        const bookingId = results.insertId;

        query =
          "UPDATE student_seat SET booking_id = ? WHERE seat_identifier IN (?)";
        db.query(
          query,
          [bookingId, seats[0]],
          function (error, results, fields) {
            if (error) throw error;

            query = `SELECT SUM(seat_pricing.normal_price) as total FROM student_seat JOIN seat_pricing ON
               student_seat.seat_class = seat_pricing.seat_class WHERE student_seat.booking_id IN (?)`;
            db.query(query, [bookingId], function (error, results, fields) {
              console.log(results);
              if (error) throw error;
              const totalAmount = "$" + results[0].total;
              console.log(totalAmount);
              res.send({ bookingId: bookingId, totalAmount: totalAmount });
            });
          }
        );
      });
    }
  });
});

app.get("/bookings", function (req, res) {
  const userIdentifier = req.query.userIdentifier;
  console.log(userIdentifier);
  if (!userIdentifier) {
    res.status(400).send({ error: "No user identifier provided." });
    return;
  }

  db.query(
    "SELECT * FROM bookings WHERE phone_number = ?",
    [userIdentifier],
    function (error, results, fields) {
      if (error) console.log(error);
      res.send(results);
      console.log(results);
      const accountSid = "AC0d9614e37fec43244ac9f2d634a8e5e8";
      const authToken = "33e33f78fe0c69148f8181822197c544";
      const client = require("twilio")(accountSid, authToken);

      client.messages
        .create({
          body: "Your booking has been confirmed",
          from: "+14847498954",
          to: "+" + userIdentifier,
        })
        .then((message) => console.log(message.sid));
    }
  );
});

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
