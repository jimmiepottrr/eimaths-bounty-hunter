<?php
/**
 * products.php — GET รายการสินค้า+ราคา (สาธารณะ ตรวจแค่ API key)
 */
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

api_key_check();

$rows = pdo()->query(
  "SELECT * FROM products ORDER BY FIELD(material,'copper','brass','aluminium'), sort_order, id"
)->fetchAll();

json_out(['products' => array_map('product_public', $rows)]);
