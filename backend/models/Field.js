const pool = require('../config/database');

class Field {
  constructor(fieldData) {
    this.id = fieldData.id;
    this.name = fieldData.name;
    this.description = fieldData.description;
    this.address = fieldData.address;
    this.latitude = parseFloat(fieldData.latitude);
    this.longitude = parseFloat(fieldData.longitude);
    this.price_per_hour = parseFloat(fieldData.price_per_hour);
    this.field_type = fieldData.field_type;
    this.surface_type = fieldData.surface_type;
    this.has_lighting = fieldData.has_lighting;
    this.has_parking = fieldData.has_parking;
    this.has_changing_room = fieldData.has_changing_room;
    this.has_shower = fieldData.has_shower;
    this.capacity = fieldData.capacity;
    this.owner_id = fieldData.owner_id;
    this.phone = fieldData.phone;
    this.email = fieldData.email;
    this.website = fieldData.website;
    this.opening_hours = fieldData.opening_hours;
    this.images = fieldData.images;
    this.amenities = fieldData.amenities;
    this.rating = parseFloat(fieldData.rating) || 0;
    this.total_reviews = fieldData.total_reviews || 0;
    this.is_active = fieldData.is_active;
    this.created_at = fieldData.created_at;
    this.updated_at = fieldData.updated_at;
  }

  // Tạo sân bóng mới
  static async create(fieldData) {
    const {
      name, description, address, latitude, longitude, price_per_hour,
      field_type, surface_type, has_lighting, has_parking, has_changing_room,
      has_shower, capacity, owner_id, phone, email, website, opening_hours,
      images, amenities
    } = fieldData;

    const query = `
      INSERT INTO football_fields (
        name, description, address, latitude, longitude, price_per_hour,
        field_type, surface_type, has_lighting, has_parking, has_changing_room,
        has_shower, capacity, owner_id, phone, email, website, opening_hours,
        images, amenities
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;

    const values = [
      name, description, address, latitude, longitude, price_per_hour,
      field_type || '5vs5', surface_type || 'artificial', has_lighting || false,
      has_parking || false, has_changing_room || false, has_shower || false,
      capacity || 10, owner_id, phone, email, website,
      opening_hours ? JSON.stringify(opening_hours) : null,
      images ? JSON.stringify(images) : null,
      amenities || []
    ];

    try {
      const result = await pool.query(query, values);
      return new Field(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Tìm tất cả sân bóng
  static async findAll(filters = {}, limit = 50, offset = 0) {
    let query = `
      SELECT f.*, u.username as owner_name, u.full_name as owner_full_name
      FROM football_fields f
      LEFT JOIN users u ON f.owner_id = u.id
      WHERE f.is_active = true
    `;
    const values = [];
    let paramCount = 1;

    // Thêm filters
    if (filters.field_type) {
      query += ` AND f.field_type = $${paramCount}`;
      values.push(filters.field_type);
      paramCount++;
    }

    if (filters.min_price) {
      query += ` AND f.price_per_hour >= $${paramCount}`;
      values.push(filters.min_price);
      paramCount++;
    }

    if (filters.max_price) {
      query += ` AND f.price_per_hour <= $${paramCount}`;
      values.push(filters.max_price);
      paramCount++;
    }

    if (filters.has_lighting !== undefined) {
      query += ` AND f.has_lighting = $${paramCount}`;
      values.push(filters.has_lighting);
      paramCount++;
    }

    query += ` ORDER BY f.rating DESC, f.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    try {
      const result = await pool.query(query, values);
      return result.rows.map(row => new Field(row));
    } catch (error) {
      throw error;
    }
  }

  // Tìm sân bóng theo ID
  static async findById(id) {
    const query = `
      SELECT f.*, u.username as owner_name, u.full_name as owner_full_name
      FROM football_fields f
      LEFT JOIN users u ON f.owner_id = u.id
      WHERE f.id = $1
    `;

    try {
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }
      return new Field(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Tìm sân bóng theo vị trí (trong bán kính km)
  static async findByLocation(latitude, longitude, radius = 10, limit = 50) {
    const query = `
      SELECT f.*, u.username as owner_name, u.full_name as owner_full_name,
             (6371 * acos(cos(radians($1)) * cos(radians(f.latitude)) *
              cos(radians(f.longitude) - radians($2)) + sin(radians($1)) *
              sin(radians(f.latitude)))) AS distance
      FROM football_fields f
      LEFT JOIN users u ON f.owner_id = u.id
      WHERE f.is_active = true
      HAVING distance < $3
      ORDER BY distance
      LIMIT $4
    `;

    try {
      const result = await pool.query(query, [latitude, longitude, radius, limit]);
      return result.rows.map(row => new Field(row));
    } catch (error) {
      throw error;
    }
  }

  // Tìm kiếm sân bóng theo tên
  static async search(searchTerm, limit = 20) {
    const query = `
      SELECT f.*, u.username as owner_name, u.full_name as owner_full_name
      FROM football_fields f
      LEFT JOIN users u ON f.owner_id = u.id
      WHERE f.is_active = true
        AND (f.name ILIKE $1 OR f.description ILIKE $1 OR f.address ILIKE $1)
      ORDER BY f.rating DESC
      LIMIT $2
    `;

    try {
      const result = await pool.query(query, [`%${searchTerm}%`, limit]);
      return result.rows.map(row => new Field(row));
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật sân bóng
  async update(updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        if (key === 'opening_hours' || key === 'images') {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this;
    }

    values.push(this.id);
    const query = `
      UPDATE football_fields
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return new Field(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Xóa sân bóng (soft delete)
  async delete() {
    const query = 'UPDATE football_fields SET is_active = false WHERE id = $1';

    try {
      await pool.query(query, [this.id]);
      this.is_active = false;
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Hard delete
  async hardDelete() {
    const query = 'DELETE FROM football_fields WHERE id = $1';

    try {
      await pool.query(query, [this.id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Field;
