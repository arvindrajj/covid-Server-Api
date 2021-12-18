const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let database = null;

//Initialize Database

const initializeDataBase = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("sever running at 3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeDataBase();

const getDbStateValuesToResponseValues = (dbValue) => {
  return {
    stateId: dbValue.state_id,
    stateName: dbValue.state_name,
    population: dbValue.population,
  };
};

const getDbDistrictValuesToResponseValues = (dbValue) => {
  return {
    districtId: dbValue.district_id,
    districtName: dbValue.district_name,
    stateId: dbValue.state_id,
    cases: dbValue.cases,
    cured: dbValue.cured,
    active: dbValue.active,
    deaths: dbValue.deaths,
  };
};

const getDbStatisticsValuesToResponseValues = (dbValue) => {
  return {
    totalCases: dbValue.cases,
    totalCured: dbValue.cured,
    totalActive: dbValue.active,
    totalDeaths: dbValue.deaths,
  };
};

//GET States

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;`;
  const statesArray = await database.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => getDbStateValuesToResponseValues(eachState))
  );
});

//GET State

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state
    WHERE state_id LIKE ${stateId};`;
  const state = await database.get(getStateQuery);
  response.send(getDbStateValuesToResponseValues(state));
});

//POST District

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const addDistrictQuery = `
    INSERT INTO district
    (district_name, state_id, cases, cured, active, deaths)
    VALUES (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  await database.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//GET District

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT * FROM district
    WHERE district_id LIKE ${districtId};`;
  const district = await database.get(getDistrictQuery);
  response.send(getDbDistrictValuesToResponseValues(district));
});

//DELETE District

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id LIKE ${districtId};`;
  await database.get(deleteDistrictQuery);
  response.send("District Removed");
});

//UPDATE District

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
    UPDATE district
    SET 
       district_name = '${districtName}',
       state_id = ${stateId},
       cases = ${cases},
       cured = ${cured},
       active = ${active},
       deaths = ${deaths}
       WHERE district_id LIKE ${districtId};`;
  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//GET State Statistics

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticsQuery = `
    SELECT SUM(cases) AS cases,
    SUM(cured) AS cured,
    SUM(active) AS active,
    SUM(deaths) AS deaths
    FROM district
    WHERE state_id LIKE ${stateId}
    GROUP BY state_id;`;
  const statistics = await database.get(getStatisticsQuery);
  response.send(getDbStatisticsValuesToResponseValues(statistics));
});

//GET State BY District

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT state.state_name
    FROM district INNER JOIN state
    ON state.state_id = district.state_id
    WHERE district.district_id LIKE ${districtId};`;
  const stateName = await database.get(getStateNameQuery);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;
