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
const mongoClient = new MongoClient(process.env.DATABASE_URL)
mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))

//Endpoints
app.post("/participants", (req, res) => {
    const {name} = req.body

    if(!name) {
        return res.status(422).send("Todos os campos são obrigatórios")
    }

    const newParticipant = { name , lastStatus: Date.now()}

    db.collection("participants").findOne({name: name})
        .then((dados) => {
            if(dados){
                return res.status(409).send("Esse usuário já existe, escolha outro usuário.")
            } else {
            db.collection("participants").insertOne(newParticipant)
                .then(() => res.status(201).send("Participante cadastrado"))
                .catch((err) => res.status(500).send(err.message))
            }
        })
        .catch((err) => res.status(500).send(err.message))

        // const {user} = req.headers
        // if(!user && user !== null) {
        //     return res.status(422).send("Todos os campos são obrigatórios")
        // }

        // const newMessage = { from: user, to, text, type, time }  

        // db.collection("messages").insertOne(newMessage)
        // .then(() => res.status(201))
        // .catch((err) => res.status(500).send(err.message))
})

app.get("/participants", (req, res) => {
    db.collection("participants").find().toArray()

        .then((part) => res.status(200).send(part))
        .catch((err) => res.status(500).send(err.message))
})


const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))    