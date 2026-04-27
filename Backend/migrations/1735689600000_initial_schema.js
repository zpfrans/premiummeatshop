/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.createType("order_status", ["pending_payment_review", "confirmed", "delivered"]);
  pgm.createType("user_role", ["admin"]);

  pgm.createTable("users", {
    id: "id",
    username: { type: "varchar(60)", notNull: true, unique: true },
    password_hash: { type: "text", notNull: true },
    role: { type: "user_role", notNull: true, default: "admin" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("NOW()") }
  });

  pgm.createTable("products", {
    id: "id",
    name: { type: "varchar(120)", notNull: true },
    category: { type: "varchar(30)", notNull: true },
    price: { type: "numeric(12,2)", notNull: true },
    unit: { type: "varchar(20)", notNull: true },
    image: { type: "varchar(255)", notNull: true, default: "" },
    in_stock: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("NOW()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("NOW()") }
  });

  pgm.createTable("orders", {
    id: "id",
    order_ref: { type: "varchar(30)", notNull: true, unique: true },
    customer_name: { type: "varchar(80)", notNull: true },
    phone: { type: "varchar(20)", notNull: true },
    address: { type: "varchar(255)", notNull: true },
    status: { type: "order_status", notNull: true, default: "pending_payment_review" },
    total: { type: "numeric(12,2)", notNull: true },
    payment_proof_path: { type: "varchar(255)" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("NOW()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("NOW()") }
  });

  pgm.createTable("order_items", {
    id: "id",
    order_id: { type: "integer", notNull: true, references: "orders", onDelete: "CASCADE" },
    product_id: { type: "integer", notNull: true, references: "products", onDelete: "RESTRICT" },
    quantity: { type: "integer", notNull: true },
    unit_price: { type: "numeric(12,2)", notNull: true },
    line_total: { type: "numeric(12,2)", notNull: true }
  });

  pgm.createTable("order_status_history", {
    id: "id",
    order_id: { type: "integer", notNull: true, references: "orders", onDelete: "CASCADE" },
    from_status: { type: "order_status" },
    to_status: { type: "order_status", notNull: true },
    changed_by: { type: "integer", references: "users", onDelete: "SET NULL" },
    note: { type: "varchar(255)" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("NOW()") }
  });

  pgm.createTable("notifications", {
    id: "id",
    order_id: { type: "integer", notNull: true, references: "orders", onDelete: "CASCADE" },
    title: { type: "varchar(120)", notNull: true },
    body: { type: "text", notNull: true },
    status: { type: "order_status", notNull: true, default: "pending_payment_review" },
    read: { type: "boolean", notNull: true, default: false },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("NOW()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("NOW()") }
  });

  pgm.createTable("expenses", {
    id: "id",
    expense_date: { type: "date", notNull: true },
    category: { type: "varchar(50)", notNull: true },
    description: { type: "varchar(255)", notNull: true },
    amount: { type: "numeric(12,2)", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("NOW()") }
  });

  pgm.createTable("audit_logs", {
    id: "id",
    actor_id: { type: "integer", references: "users", onDelete: "SET NULL" },
    action: { type: "varchar(80)", notNull: true },
    entity_type: { type: "varchar(50)", notNull: true },
    entity_id: { type: "integer" },
    metadata: { type: "jsonb", notNull: true, default: "{}" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("NOW()") }
  });

  pgm.createIndex("orders", ["order_ref"]);
  pgm.createIndex("orders", ["status", "created_at"]);
  pgm.createIndex("notifications", ["status", "read", "created_at"]);
  pgm.createIndex("order_status_history", ["order_id", "created_at"]);
};

export const down = (pgm) => {
  pgm.dropTable("audit_logs");
  pgm.dropTable("expenses");
  pgm.dropTable("notifications");
  pgm.dropTable("order_status_history");
  pgm.dropTable("order_items");
  pgm.dropTable("orders");
  pgm.dropTable("products");
  pgm.dropTable("users");
  pgm.dropType("order_status");
  pgm.dropType("user_role");
};
