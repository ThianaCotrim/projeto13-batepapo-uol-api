import express from "express";
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"

//Criação de um Servidor
const app = express()

//Configurações do app
app.use(express.json())
app.use(cors())
dotenv.config()

//Configurações de banco de dados
let db
const mongoClient = new MongoClient("mongodb://localhost:27017/batePapoUol")
mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))

//Endpoints



const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))    