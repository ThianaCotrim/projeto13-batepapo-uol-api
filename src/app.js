import express from "express";
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import dayjs from "dayjs"
import joi from "joi";

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

    const userSchema = joi.object({ name: joi.string().required()})
    const validate = userSchema.validate(req.body)

    if (validate.error){
        return res.sendStatus(422)
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

app.post("/messages", async (req, res) => {
    const {to, text, type} = req.body
    const from = req.headers.user 
    const tiposMsg= ["message", "private_message"]
    const {user} = req.headers

    const userSchema = joi.object({ 
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required().valid(tiposMsg),
        from: joi.string()})

    const validate = userSchema.validate(req.body)

    if (validate.error){
        return res.sendStatus(422)
    }

   
        const isParticipant =  db.collection("participants").findOne({ name: user })
        if (!isParticipant) return res.status(422).send("Este usuário saiu")
  
    

    const msg = {
        to,
        text,
        type,
        from,
        time: dayjs().format("HH:mm:ss")
    }

    db.collection("participants").find({name: from}).toArray()
        .then(u => {
            if (!u.length){
                return res.status(402).send("É necessário estar ativo/logado")
            }
            db.collection("messages").insertOne(msg)
            .then(() => { return res.status(201).send("Menssagem enviada com sucesso")})
            .catch((err) => {
                console.log(err)
                return res.status(500)
            })
        })
        .catch((err) => {
            console.log(err)
            return res.status(500)
        })
})

app.get("/messages", (req, res) => {
    const { limit } = req.query
    const name = req.headers.user 


    if(!name) return res.sendStatus(409)

    db.collection("messages").find().toArray()

        .then(messages => {

            const enviarMsg = messages.filter((msg) => {
                if (name === msg.to || name === msg.from || msg.to === "Todos" || msg.type === "status"){
                    return msg
                }
            })
            if (!limit) {
                return res.send(enviarMsg)
            }
            if (limit > 0 && !Number.isNaN(Number(limit))) {
                return res.send(enviarMsg.slice(-limit))
            }

            return res.status(422).send("Valor não definido")})

        .catch((err) => res.send(err.message))

});

app.post("/status", async (req, res) => {

    const {user} = req.headers

        try {
            const verIncluiPart = await db.collection("participants").findOne({name: user})

            if (!verIncluiPart){
                return res.sendStatus(404)
            } else {
                await db.collection("participants").updateOne({name: user}, {$set: {lastStatus: Date.now()}})
                return res.sendStatus(200)
            }
        } catch {return res.sendStatus(404)}
           
})


async function removerParticipantesAntigos (){
    const agora = Date.now()

    try{
        const offline = await db.collection("participants").find({lastStatus: {$lt: agora - 10000}}).toArray()
        offline.forEach(async ({name}) => {
            
            const msgSaida = {
                from: name,
                to: "Todos",
                text: "sai da sala...",
                type: 'status',
                time:dayjs().format("HH:mm:ss")
              }
              try {
                const count = await db.collection("participants").deleteOne({name})
                await db.collection("messages").insertOne(msgSaida)    
                console.log(count.deletedCount)

              } catch (err){console.log(err.message)}
        })
    } catch(err) {}
}

function atualizador () {

  setInterval(() => {
    removerParticipantesAntigos()
 
         }, 15000)}

    atualizador ()


const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))    