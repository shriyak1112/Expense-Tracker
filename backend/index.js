import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import passport from 'passport';
import session from 'express-session';
import connectMongo from "connect-mongodb-session"
import dotenv from "dotenv"
import { connectDB } from './db/connectDB.js';
import { ApolloServer } from "@apollo/server"
import mergeResolvers from "./resolvers/index.js"
import mergeTypeDef from "./typeDefs/index.js"
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import { configurePassport } from './passport/passport.config.js';
import { buildContext } from "graphql-passport";



dotenv.config();
configurePassport();

const __dirname = path.resolve();
const app = express();


const httpServer = http.createServer(app);

const MongoDBStore = connectMongo(session);

const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection:"sessions",

})

store.on("error",(err) => console.log(err));

app.use(
    session(
        {
            secret: process.env.SESSION_SECRET,
            resave: false, //if true will be have multiple sessions of the same user
            saveUninitialized: false, // option specifies whether to save uninitialized sessions
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 7,
                httpOnly: true, //  prevents the Cross-Site Scripting attacks
                
            },
            store: store,
        })
)

app.use(passport.initialize());
app.use(passport.session());

const server = new ApolloServer({
    typeDefs :mergeTypeDef,
    resolvers :mergeResolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
})
await server.start();
app.use(
    "/graphql",
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    }),
    express.json(),
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    expressMiddleware(server, {
        context: async ({ req, res }) => buildContext({ req, res }),
    })
);

app.use(express.static(path.join(__dirname, "frontend/dist")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/dist", "index.html"));
});

await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));

await connectDB();

console.log(`🚀 Server ready at http://localhost:4000/graphql`);





