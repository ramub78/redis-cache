const express = require("express");
const axios = require("axios");
const redis = require("redis");

const app = express();

const port = 8080;

// make a connection to the local instance of redis
const client = redis.createClient(6379);

client.on("error", error => {
  console.error(error);
});

// localhost:8080/jobs?search=node&type=Full Time&title=Software Engineer
app.get("/jobs", (req, res) => {
  try {
    const { search, type, title } = req.query;

    // Check the redis store for the data first
    client.get("jobs", async (err, jobs) => {
      if (jobs) {
        return res.status(200).send({
          error: false,
          message: `Jobs from the cache`,
          data: JSON.parse(jobs)
        });
      } else {
        // When the data is not found in the cache then we can make request to the server

        const foundResults = await axios.get(
          `https://jobs.github.com/positions.json?search=${search}&type=${type}&title=${title}`
        );

        // save the record in the cache for subsequent request
        client.setex("jobs", 1440, JSON.stringify(foundResults.data));

        // return the result to the client
        return res.status(200).send({
          error: false,
          message: `Jobs from the server`,
          data: foundResults.data
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
