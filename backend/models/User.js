const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.email = userData.email;
    this.password = userData.password;
    this.full_name = userData.full_name;
    this.phone = userData.phone;
    this.avatar_url = userData.avatar_url;
    this.is_active = userData.is_active;
    this.role = userData.role;
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
  }

  // Tạo user mới
  static async create(userData) {
    const { username, email, password, full_name, phone, role = 'user' } = userData;

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (username, email, password, full_name, phone, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [username, email, hashedPassword, full_name, phone, role];

    try {
      const result = await pool.query(query, values);
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Tìm user theo username
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';

    try {
      const result = await pool.query(query, [username]);
      if (result.rows.length === 0) {
        return null;
      }
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Tìm user theo email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';

    try {
      const result = await pool.query(query, [email]);
      if (result.rows.length === 0) {
        return null;
      }
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Tìm user theo ID
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';

    try {
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // So sánh password
  async comparePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Cập nhật user
  async update(updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this;
    }

    values.push(this.id);
    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Xóa user
  async delete() {
    const query = 'DELETE FROM users WHERE id = $1';

    try {
      await pool.query(query, [this.id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả users
  static async findAll(limit = 50, offset = 0) {
    const query = `
      SELECT * FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    try {
      const result = await pool.query(query, [limit, offset]);
      return result.rows.map(row => new User(row));
    } catch (error) {
      throw error;
    }
  }

  // Chuyển đổi thành JSON (loại bỏ password)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;
