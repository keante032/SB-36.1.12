const Router = require("express").Router;
const router = new Router();
const Message = require("../models/message");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", async function (req, res, next) {
    try {
        const msg = await Message.get(req.params.id);
        // current user must match either from_user or to_user of this message to gain access
        // can't use ensureCorrectUser() because it expects username to be in req.params
        if (req.user.username === msg.from_user.username || req.user.username === msg.to_user.username) {
            return res.json(msg);
        } else {
            return next({ status: 401, message: "Unauthorized" });
        }
    } catch (e) { return next(e); }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const { to_username, body } = req.body;
        const from_username = req.user.username;
        msg = await Message.create({ from_username, to_username, body });
        return res.json({ message: msg });
    } catch (e) { return next(e); }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", async function (req, res, next) {
    try {
        const msg = await Message.get(req.params.id);
        // current user must match to_user of this message to gain access
        // can't use ensureCorrectUser() because it expects username to be in req.params
        if (req.user.username === msg.to_user.username) {
            const readMsg = await Message.markRead(req.params.id);
        } else {
            return next({ status: 401, message: "Unauthorized" });
        }
    } catch (e) { return next(e); }
});
