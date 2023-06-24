import { Router } from "express"
import { Composer } from "grammy"

export const aleister = new Composer
export const treeDiagram = Router()

treeDiagram.get('/oauth', async (req, res) => {
    if(!req.query.code) {
        return res.redirect('/')
    }
    if(!req.query.id) {
        return res.redirect('/wrong')
    }
    // TODO
    // axi
})