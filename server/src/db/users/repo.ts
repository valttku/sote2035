import { db } from "../db.js";

export type User = {
  id: number;
  username: string;
  password: string;
};

// return all users
export async function listUsers(): Promise<User[]> {
  const { rows } = await db.query<User>(
    "select id, username, password from app.users order by id asc"
  );
  return rows;
}

// find one user by username
export async function findUserByUsername(username: string): Promise<User | null> {
  const { rows } = await db.query<User>(
    "select id, username, password from app.users where username = $1",
    [username]
  );
  return rows[0] ?? null;
}

// create a new user
export async function createUser(username: string, password: string): Promise<User> {
  const { rows } = await db.query<User>(
    "insert into app.users (username, password) values ($1, $2) returning id, username, password",
    [username, password]
  );
  return rows[0];
}

// delete a user by id
export async function deleteUser(id: number): Promise<void> {
  await db.query("delete from app.users where id = $1", [id]);
}
