const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()

app.use(express.json())
const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()
const convertStateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}
app.get('/states/', async (request, response) => {
  const a = `
 SELECT
  *
 FROM
  state
  ORDER BY
  state_id;`
  const b = await db.all(a)
  response.send(b.map(i => convertStateDbObjectToResponseObject(i)))
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const api3 = `
    SELECT
     *
    FROM
     state
    WHERE
      state_id = ${stateId};`
  const db2 = await db.get(api3)
  response.send(convertStateDbObjectToResponseObject(db2))
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const api2 = `
     INSERT INTO
       district (district_name, state_id, cases, cured, active, deaths)
     VALUES
       (
         '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths}
       );`

  await db.run(api2)

  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const api3 = `
    SELECT
     *
    FROM
     district
    WHERE
      district_id = ${districtId};`
  const db2 = await db.get(api3)
  response.send(convertDistrictDbObjectToResponseObject(db2))
})
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const api5 = `
    DELETE FROM
      district
    WHERE
      district_id = ${districtId};`
  await db.run(api5)
  response.send('District Removed')
})
app.put('/districts/:districtId/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const {districtId} = request.params

  const api4 = `
       UPDATE
         district
       SET
         district_name='${districtName}',
         state_id=${stateId},
         cases=${cases},
         cured=${cured},
         active=${active},
         deaths=${deaths}
       WHERE
         district_id = ${districtId};`
  await db.run(api4)
  response.send('District Details Updated')
})
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
     SELECT
       SUM(cases) AS totalCases,
       SUM(cured) AS totalCured,
       SUM(active) AS totalActive,
       SUM(deaths) AS totalDeaths
     FROM
       district
     WHERE
       state_id = ${stateId};`
  const stats = await db.get(getStateStatsQuery)
  response.send(stats)
})
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
     SELECT
       state_name AS stateName
     FROM
       district NATURAL JOIN state
     WHERE 
       district_id = ${districtId};`
  const state = await db.get(getStateNameQuery)
  response.send(state)
})
module.exports = app
