import express from "express";
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import dayjs from "dayjs";

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
        res.status(422).send("Todos os campos são obrigatórios")
        return
    }

    const newParticipant = { name , lastStatus: Date.now()}

    const newMessage = {  
        from: name, 
        to: 'Todos', 
        text: 'entra na sala...', 
        type: 'status', 
        time: dayjs().format('HH:mm:ss') 
    }  

    db.collection("participants").find({name: name}).toArray()
        .then((dados) => {
            if(!dados.length){
                db.collection("participants").insertOne(newParticipant)
                .then(() => { 
                    db.collection("messages").insertOne(newMessage)
                    .then(() => {
                        res.status(201).send("Participante cadastrado")
                        console.log(newMessage)
                        return
                    })
                    .catch((err) => res.status(422).send(err.message))
                })
                .catch((err) => res.status(422).send(err.message))
                return
            }
                return res.status(409).send("Esse usuário já existe, escolha outro usuário.")
        })
        .catch((err) => res.status(500).send(err.message))
       
})

app.get("/participants", (req, res) => {
    db.collection("participants").find().toArray()

        .then((part) => res.status(200).send(part))
        .catch((err) => res.status(500).send(err.message))
})

app.post("messages", (req, res) => {
    const {to, text, type} = req.body
    const from = req.headers.user 

})

app.get("/messages", (req, res) => {

    const name = req.headers.user 
    if(!name) return res.sendStatus(409)

    db.collection("messages").find().toArray()

        .then((messages) => {
            console.log(messages)
            return res.status(200).send(messages)})
        .catch((err) => res.status(500).send(err.message))
})


const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))    