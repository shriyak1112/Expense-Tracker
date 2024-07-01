import express from 'express';
import http from 'http';
import cors from 'cors';
import { ApolloServer } from "@apollo/server"
import mergeResolvers from "./resolvers/index.js"
import mergeTypeDef from "./typeDefs/index.js"
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import dotenv from "dotenv"
import { connectDB } from './db/connectDB.js';


dotenv.config();

const app = express();

const httpServer = http.createServer(app);

const server = new ApolloServer({
    typeDefs :mergeTypeDef,
    resolvers :mergeResolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
})
await server.start();
app.use(
    '/',
    cors(),
    express.json(),
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    expressMiddleware(server, {
        context: async ({ req }) => ({ token: req.headers.token }),
    }),
);

await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));

await connectDB();

console.log(`🚀 Server ready at http://localhost:4000/`);