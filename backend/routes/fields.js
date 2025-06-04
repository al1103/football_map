const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// @route   GET /api/fields
// @desc    Get all football fields with filters
router.get('/', async (req, res) => {
    try {
        const {
            field_type,
            surface_type,
            min_price,
            max_price,
            has_lighting,
            has_parking,
            has_changing_room,
            has_shower,
            capacity,
            limit = 50,
            offset = 0,
            lat,
            lng,
            radius = 10,
            search,
            is_active = true
        } = req.query;

        let query = `
            SELECT id, name, description, address, latitude, longitude,
                   price_per_hour, field_type, surface_type, capacity,
                   has_lighting, has_parking, has_changing_room, has_shower,
                   amenities, phone, email, website, images, rating,
                   total_reviews, opening_hours, is_active, created_at, updated_at
            FROM fields
            WHERE is_active = $1
        `;
        let params = [is_active === 'true' || is_active === true];
        let paramCount = 1;

        // Search by name or description
        if (search) {
            paramCount++;
            query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        // Location-based search
        if (lat && lng && radius) {
            paramCount++;
            query += ` AND (
                6371 * acos(
                    cos(radians($${paramCount})) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians($${paramCount + 1})) +
                    sin(radians($${paramCount})) * sin(radians(latitude))
                )
            ) <= $${paramCount + 2}`;
            params.push(parseFloat(lat), parseFloat(lng), parseFloat(radius));
            paramCount += 2;
        }

        // Filter by field type
        if (field_type) {
            paramCount++;
            query += ` AND field_type = $${paramCount}`;
            params.push(field_type);
        }

        // Filter by surface type
        if (surface_type) {
            paramCount++;
            query += ` AND surface_type = $${paramCount}`;
            params.push(surface_type);
        }

        // Filter by price range
        if (min_price) {
            paramCount++;
            query += ` AND price_per_hour >= $${paramCount}`;
            params.push(parseFloat(min_price));
        }

        if (max_price) {
            paramCount++;
            query += ` AND price_per_hour <= $${paramCount}`;
            params.push(parseFloat(max_price));
        }

        // Filter by amenities
        if (has_lighting !== undefined) {
            paramCount++;
            query += ` AND has_lighting = $${paramCount}`;
            params.push(has_lighting === 'true' || has_lighting === true);
        }

        if (has_parking !== undefined) {
            paramCount++;
            query += ` AND has_parking = $${paramCount}`;
            params.push(has_parking === 'true' || has_parking === true);
        }

        if (has_changing_room !== undefined) {
            paramCount++;
            query += ` AND has_changing_room = $${paramCount}`;
            params.push(has_changing_room === 'true' || has_changing_room === true);
        }

        if (has_shower !== undefined) {
            paramCount++;
            query += ` AND has_shower = $${paramCount}`;
            params.push(has_shower === 'true' || has_shower === true);
        }

        if (capacity) {
            paramCount++;
            query += ` AND capacity >= $${paramCount}`;
            params.push(parseInt(capacity));
        }

        // Add ordering and pagination
        query += ` ORDER BY rating DESC, total_reviews DESC, created_at DESC`;

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(parseInt(limit));

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(parseInt(offset));

        const result = await pool.query(query, params);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Get fields error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy danh sách sân bóng'
        });
    }
});

// @route   GET /api/fields/:id
// @desc    Get a specific football field by ID
router.get('/:id', async (req, res) => {
    try {
        const query = `
            SELECT id, name, description, address, latitude, longitude,
                   price_per_hour, field_type, surface_type, capacity,
                   has_lighting, has_parking, has_changing_room, has_shower,
                   amenities, phone, email, website, images, rating,
                   total_reviews, opening_hours, is_active, owner_id,
                   created_at, updated_at
            FROM fields
            WHERE id = $1 AND is_active = true
        `;

        const result = await pool.query(query, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy sân bóng'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Get field error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy thông tin sân bóng'
        });
    }
});

// @route   POST /api/fields
// @desc    Create a new football field
router.post('/', async (req, res) => {
    try {
        const {
            name,
            description,
            address,
            latitude,
            longitude,
            price_per_hour,
            field_type,
            surface_type,
            capacity,
            has_lighting = false,
            has_parking = false,
            has_changing_room = false,
            has_shower = false,
            amenities,
            phone,
            email,
            website,
            images,
            opening_hours,
            owner_id
        } = req.body;

        // Validate required fields
        if (!name || !address || !latitude || !longitude || !price_per_hour) {
            return res.status(400).json({
                success: false,
                error: 'Thiếu thông tin bắt buộc (tên, địa chỉ, tọa độ, giá)'
            });
        }

        const query = `
            INSERT INTO fields (
                name, description, address, latitude, longitude, price_per_hour,
                field_type, surface_type, capacity, has_lighting, has_parking,
                has_changing_room, has_shower, amenities, phone, email, website,
                images, opening_hours, owner_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20
            ) RETURNING *
        `;

        const values = [
            name,
            description,
            address,
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(price_per_hour),
            field_type,
            surface_type,
            capacity ? parseInt(capacity) : null,
            Boolean(has_lighting),
            Boolean(has_parking),
            Boolean(has_changing_room),
            Boolean(has_shower),
            amenities,
            phone,
            email,
            website,
            images ? (Array.isArray(images) ? images : [images]) : null,
            opening_hours ? (typeof opening_hours === 'string' ? JSON.parse(opening_hours) : opening_hours) : null,
            owner_id ? parseInt(owner_id) : null
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            success: true,
            message: 'Tạo sân bóng thành công',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Create field error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi tạo sân bóng'
        });
    }
});

// @route   PUT /api/fields/:id
// @desc    Update a football field
router.put('/:id', async (req, res) => {
    try {
        // First check if field exists
        const checkQuery = 'SELECT id FROM fields WHERE id = $1 AND is_active = true';
        const checkResult = await pool.query(checkQuery, [req.params.id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy sân bóng'
            });
        }

        const {
            name,
            description,
            address,
            latitude,
            longitude,
            price_per_hour,
            field_type,
            surface_type,
            capacity,
            has_lighting,
            has_parking,
            has_changing_room,
            has_shower,
            amenities,
            phone,
            email,
            website,
            images,
            opening_hours
        } = req.body;

        const updateFields = [];
        const values = [];
        let paramCount = 0;

        // Build dynamic update query
        if (name !== undefined) {
            paramCount++;
            updateFields.push(`name = $${paramCount}`);
            values.push(name);
        }
        if (description !== undefined) {
            paramCount++;
            updateFields.push(`description = $${paramCount}`);
            values.push(description);
        }
        if (address !== undefined) {
            paramCount++;
            updateFields.push(`address = $${paramCount}`);
            values.push(address);
        }
        if (latitude !== undefined) {
            paramCount++;
            updateFields.push(`latitude = $${paramCount}`);
            values.push(parseFloat(latitude));
        }
        if (longitude !== undefined) {
            paramCount++;
            updateFields.push(`longitude = $${paramCount}`);
            values.push(parseFloat(longitude));
        }
        if (price_per_hour !== undefined) {
            paramCount++;
            updateFields.push(`price_per_hour = $${paramCount}`);
            values.push(parseFloat(price_per_hour));
        }
        if (field_type !== undefined) {
            paramCount++;
            updateFields.push(`field_type = $${paramCount}`);
            values.push(field_type);
        }
        if (surface_type !== undefined) {
            paramCount++;
            updateFields.push(`surface_type = $${paramCount}`);
            values.push(surface_type);
        }
        if (capacity !== undefined) {
            paramCount++;
            updateFields.push(`capacity = $${paramCount}`);
            values.push(capacity ? parseInt(capacity) : null);
        }
        if (has_lighting !== undefined) {
            paramCount++;
            updateFields.push(`has_lighting = $${paramCount}`);
            values.push(Boolean(has_lighting));
        }
        if (has_parking !== undefined) {
            paramCount++;
            updateFields.push(`has_parking = $${paramCount}`);
            values.push(Boolean(has_parking));
        }
        if (has_changing_room !== undefined) {
            paramCount++;
            updateFields.push(`has_changing_room = $${paramCount}`);
            values.push(Boolean(has_changing_room));
        }
        if (has_shower !== undefined) {
            paramCount++;
            updateFields.push(`has_shower = $${paramCount}`);
            values.push(Boolean(has_shower));
        }
        if (amenities !== undefined) {
            paramCount++;
            updateFields.push(`amenities = $${paramCount}`);
            values.push(amenities);
        }
        if (phone !== undefined) {
            paramCount++;
            updateFields.push(`phone = $${paramCount}`);
            values.push(phone);
        }
        if (email !== undefined) {
            paramCount++;
            updateFields.push(`email = $${paramCount}`);
            values.push(email);
        }
        if (website !== undefined) {
            paramCount++;
            updateFields.push(`website = $${paramCount}`);
            values.push(website);
        }
        if (images !== undefined) {
            paramCount++;
            updateFields.push(`images = $${paramCount}`);
            values.push(images ? (Array.isArray(images) ? images : [images]) : null);
        }
        if (opening_hours !== undefined) {
            paramCount++;
            updateFields.push(`opening_hours = $${paramCount}`);
            values.push(opening_hours ? (typeof opening_hours === 'string' ? JSON.parse(opening_hours) : opening_hours) : null);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Không có dữ liệu để cập nhật'
            });
        }

        // Add the ID parameter for WHERE clause
        paramCount++;
        values.push(req.params.id);

        const query = `
            UPDATE fields
            SET ${updateFields.join(', ')}, updated_at = NOW()
            WHERE id = $${paramCount} AND is_active = true
            RETURNING *
        `;

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Cập nhật sân bóng thành công',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update field error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi cập nhật sân bóng'
        });
    }
});

// @route   DELETE /api/fields/:id
// @desc    Delete a football field (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const query = `
            UPDATE fields
            SET is_active = false, updated_at = NOW()
            WHERE id = $1 AND is_active = true
            RETURNING id, name
        `;

        const result = await pool.query(query, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy sân bóng'
            });
        }

        res.json({
            success: true,
            message: 'Xóa sân bóng thành công',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Delete field error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi xóa sân bóng'
        });
    }
});

// @route   GET /api/fields/stats/summary
// @desc    Get fields statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const query = `
            SELECT
                COUNT(*) as total_fields,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_fields,
                AVG(rating) as average_rating,
                AVG(price_per_hour) as average_price,
                field_type,
                COUNT(*) as count_by_type
            FROM fields
            GROUP BY field_type
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Lỗi server khi lấy thống kê'
        });
    }
});

module.exports = router;
