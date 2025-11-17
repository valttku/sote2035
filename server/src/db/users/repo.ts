import { db } from "../db.js";

export type User = {
  id: number;
  email: string;
  password: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
};

// return all users
export async function listUsers(): Promise<User[]> {
  const { rows } = await db.query<User>(
    `select id, email, password, display_name, created_at, updated_at, last_login
     from app.users
     order by id asc`
  );
  return rows;
}

// find one user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await db.query<User>(
    `select id, email, password, display_name, created_at, updated_at, last_login
     from app.users
     where email = $1`,
    [email]
  );
  return rows[0] ?? null;
}

// create a new user
export async function createUser(
  email: string,
  password: string,
  displayName: string | null
): Promise<User> {
  const { rows } = await db.query<User>(
    `insert into app.users (email, password, display_name)
     values ($1, $2, $3)
     returning id, email, password, display_name, created_at, updated_at, last_login`,
    [email, password, displayName]
  );
  return rows[0];
}

// update last_login timestamp
export async function updateLastLogin(id: number): Promise<void> {
  await db.query(
    `update app.users
     set last_login = now()
     where id = $1`,
    [id]
  );
}

// delete a user by id
export async function deleteUser(id: number): Promise<void> {
  await db.query("delete from app.users where id = $1", [id]);
}

// delete a session by id
export async function deleteSession(sessionId: string): Promise<void> {
  await db.query(
    `delete from app.sessions
     where id = $1`,
    [sessionId]
  );
}
