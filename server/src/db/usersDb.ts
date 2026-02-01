import { db } from "./db.js";

//add here
export type Gender = "male" | "female" | "other" | "unknown";

//User type
export type User = {
  id: number;
  email: string;
  password: string;
  display_name: string | null;
  height: number | null;
  weight: number | null;
  gender: Gender | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
};

// Create a new user
export async function createUser(
  email: string,
  password: string,
  displayName: string | null,
  gender: Gender | null,
  height: number | null,
  weight: number | null,
): Promise<User> {
  const { rows } = await db.query<User>(
    `INSERT INTO app.users (
      email,
      password,
      display_name,
      gender,
      height,
      weight
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`, //  returns all columns
    [email, password, displayName, gender, height, weight],
  );
  return rows[0];
}

// return all users
export async function listUsers(): Promise<User[]> {
  const { rows } = await db.query<User>(
    `select id, email, password, display_name, 
    //add here new paarmeters
    gender,height, weight, created_at, updated_at, last_login
    
     from app.users
     order by id asc`,
  );
  return rows;
}

// find one user by email

export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await db.query<User>(
    `select id, email, password, gender, height, weight, display_name, created_at, updated_at, last_login
     from app.users
     where email = $1`,
    [email],
  );
  return rows[0] ?? null;
}

// update last_login timestamp
export async function updateLastLogin(id: number): Promise<void> {
  await db.query(
    `update app.users
     set last_login = now()
     where id = $1`,
    [id],
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
    [sessionId],
  );
}

//Add here
export async function getUserById(userId: number) {
  const result = await db.query(
    `
    SELECT
      id,
      email,
      display_name,
      gender,
      height,
      weight,
      created_at,
      updated_at,
      last_login
    FROM app.users
    WHERE id = $1
    `,
    [userId],
  );

  return result.rows[0];
}

export async function updateUserProfile(
  userId: number,
  data: {
    displayName?: string | null;
    gender?: string | null;
    height?: number | null;
    weight?: number | null;
  },
) {
  await db.query(
    `
    UPDATE app.users
    SET
      display_name = $2,
      gender = $3,
      height = $4,
      weight = $5,
      updated_at = now()
    WHERE id = $1
    `,
    [
      userId,
      data.displayName ?? null,
      data.gender ?? null,
      data.height ?? null,
      data.weight ?? null,
    ],
  );
}
