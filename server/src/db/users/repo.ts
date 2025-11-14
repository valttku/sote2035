import { db } from "../db.js";

export type User = {
  id: number;
  email: string;
  password: string;
  display_name: string | null;
};

// return all users
export async function listUsers(): Promise<User[]> {
  const { rows } = await db.query<User>(
    "select id, email, password, display_name from app.users order by id asc"
  );
  return rows;
}

// find one user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await db.query<User>(
    "select id, email, password, display_name from app.users where email = $1",
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
     returning id, email, password, display_name`,
    [email, password, displayName]
  );
  return rows[0];
}

// delete a user by id
export async function deleteUser(id: number): Promise<void> {
  await db.query("delete from app.users where id = $1", [id]);
}
