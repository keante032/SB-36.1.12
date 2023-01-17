/** User class for message.ly */

const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

/** User of the site. */

class User {
  constructor({ username, password, firstName, lastName, phone, joinAt, lastLoginAt }) {
    this.username = username;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.joinAt = joinAt;
    this.lastLoginAt = lastLoginAt;
  }

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, firstName, lastName, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
        `INSERT INTO users (
              username,
              password,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at)
            VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
            RETURNING username, password, first_name, last_name, phone, join_at, last_login_at`,
        [username, hashedPassword, firstName, lastName, phone]);

    return new User(result.rows[0]);
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(`SELECT username, password FROM users WHERE username = $1`, [username]);
    const user = result.rows[0];
    return user && await bcrypt.compare(password, user.password);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users SET last_login_at=current_timestamp WHERE username=$1`,
      [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(`SELECT username, first_name, last_name, phone FROM users`);
    return results.rows.map(u => new User(u));
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username=$1`, [username]);
    const user = results.rows[0];

    if (user === undefined) {
      const err = new Error(`No such user: ${username}`);
      err.status = 404;
      throw err;
    }

    return new User(user);
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { }
}


module.exports = User;