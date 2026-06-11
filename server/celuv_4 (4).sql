-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 11, 2026 at 05:09 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `celuv_4`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `booth_id` int(11) NOT NULL,
  `schedule_id` int(11) DEFAULT NULL,
  `expected_clock_in` time DEFAULT NULL,
  `expected_clock_out` time DEFAULT NULL,
  `date` date NOT NULL,
  `shift` enum('pagi','malam') NOT NULL,
  `is_override` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('hadir','terlambat','absen','izin','sakit','libur') DEFAULT NULL,
  `clock_in` time DEFAULT NULL,
  `clock_out` time DEFAULT NULL,
  `lat_in` decimal(10,8) DEFAULT NULL,
  `lon_in` decimal(11,8) DEFAULT NULL,
  `lat_out` decimal(10,8) DEFAULT NULL,
  `lon_out` decimal(11,8) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `batches`
--

CREATE TABLE `batches` (
  `id` int(11) NOT NULL,
  `production_id` int(11) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `booth_id` int(11) DEFAULT NULL,
  `recipe_id` int(11) DEFAULT NULL,
  `produced_at` datetime DEFAULT NULL,
  `expired_at` datetime DEFAULT NULL,
  `total_qty` int(11) DEFAULT NULL,
  `remaining_qty` int(11) DEFAULT NULL,
  `status` enum('ACTIVE','FROZEN','SOLD_OUT','EXPIRED','DAMAGED') DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `batches`
--

INSERT INTO `batches` (`id`, `production_id`, `location_id`, `booth_id`, `recipe_id`, `produced_at`, `expired_at`, `total_qty`, `remaining_qty`, `status`, `notes`) VALUES
(15, 18, 3, 2, 9, '2026-06-11 09:31:25', '2026-06-11 16:31:25', 2700, 2700, 'ACTIVE', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `booth`
--

CREATE TABLE `booth` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` varchar(100) NOT NULL,
  `longitude` decimal(18,8) DEFAULT NULL,
  `latitude` decimal(18,8) DEFAULT NULL,
  `penyewa` varchar(20) DEFAULT NULL,
  `cp_penyewa` varchar(20) DEFAULT NULL,
  `harga` decimal(11,3) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `is_open` tinyint(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `booth`
--

INSERT INTO `booth` (`id`, `name`, `address`, `longitude`, `latitude`, `penyewa`, `cp_penyewa`, `harga`, `is_active`, `is_open`, `created_at`) VALUES
(1, 'Kebonrojo', 'Depan Kebon Rojo', 112.17542100, -8.09579900, 'Petugas', '787897898', 200000.000, 1, 0, '2026-04-22 09:37:42'),
(2, 'Pasar Banggle', 'Depan annaja', 112.19988200, -8.11139200, 'Pak Su', '098549339992', 200000.000, 1, 0, '2026-04-22 09:38:03'),
(3, 'Pasar Legiii', 'Timur Pasar Legi (luar)', 112.15838300, -8.09928000, 'Pak Su', '08440044003', 500000.000, 1, 0, '2026-05-04 09:23:01'),
(4, 'Pasar Templek', 'Timur Pasar templek', 112.15838300, -8.09912300, 'Pak Daddd', '0648492829', 400000.000, 1, 0, '2026-05-04 09:31:08'),
(5, 'Tanjung', 'Jl tanjung depan sdn', 112.15838300, -8.08620700, 'Bu Yeye', '083040555300', 500000.000, 1, 0, '2026-05-05 20:26:55'),
(6, 'Talun', 'Jln Raya Talun', 112.26074700, -8.08620700, 'Bapak Heri', '0887867668', 500000.000, 0, 0, '2026-05-15 07:46:18'),
(7, 'Ponggok', 'Pojok ponggok', 112.12310700, -8.04115600, 'Bu Tres', '09090901129', 200000.000, 1, 0, '2026-05-20 07:05:47'),
(8, 'pandan', 'blitar', 112.21969000, -8.14755900, 'joko', '0909090', 10000.000, 1, 0, '2026-05-30 13:39:54'),
(9, 'Kademangan', 'Barat Jalan Kademangan', 112.14337300, -8.14630100, 'Bu Yus', '087876768678', 400000.000, 1, 0, '2026-06-09 20:30:20'),
(10, 'Tes Unisba', ' Jl. Majapahit No. 2-4, Sananwetan, Kota Blitar', 112.18373500, -8.09791000, 'Bu', '90909090', 300000.000, 1, 0, '2026-06-11 00:13:26');

-- --------------------------------------------------------

--
-- Table structure for table `distributions`
--

CREATE TABLE `distributions` (
  `id` int(11) NOT NULL,
  `type` enum('warehouse_to_booth','booth_to_booth') NOT NULL,
  `from_location_id` int(11) NOT NULL,
  `to_location_id` int(11) NOT NULL,
  `kurir_id` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `planned_date` date NOT NULL,
  `status` enum('draft','dikirim','diterima','dibatalkan','sampai','kurang','sesuai') NOT NULL DEFAULT 'draft',
  `confirmed_by_kurir` int(11) DEFAULT NULL,
  `confirmed_at_kurir` datetime DEFAULT NULL,
  `confirmed_by_booth` int(11) DEFAULT NULL,
  `confirmed_at_booth` datetime DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `arrived_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `distributions`
--

INSERT INTO `distributions` (`id`, `type`, `from_location_id`, `to_location_id`, `kurir_id`, `created_by`, `planned_date`, `status`, `confirmed_by_kurir`, `confirmed_at_kurir`, `confirmed_by_booth`, `confirmed_at_booth`, `notes`, `created_at`, `arrived_at`) VALUES
(21, 'warehouse_to_booth', 1, 3, NULL, 1, '2026-06-11', 'diterima', 1, '2026-06-11 07:48:05', 12, '2026-06-11 09:01:45', NULL, '2026-06-11 00:47:55', '2026-06-11 07:48:08'),
(22, 'warehouse_to_booth', 1, 3, 3, 1, '2026-06-11', 'diterima', 3, '2026-06-11 09:05:22', 12, '2026-06-11 09:05:38', NULL, '2026-06-11 02:05:04', '2026-06-11 09:05:24');

-- --------------------------------------------------------

--
-- Table structure for table `distribution_items`
--

CREATE TABLE `distribution_items` (
  `distribution_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `qty` decimal(10,2) NOT NULL,
  `input_qty` decimal(10,2) DEFAULT NULL,
  `input_unit` varchar(20) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `qty_diterima` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `distribution_items`
--

INSERT INTO `distribution_items` (`distribution_id`, `item_id`, `qty`, `input_qty`, `input_unit`, `notes`, `qty_diterima`) VALUES
(21, 57, 1600.00, NULL, NULL, NULL, 1600),
(22, 49, 2000.00, NULL, NULL, NULL, 2000),
(22, 50, 25.00, NULL, NULL, NULL, 25),
(22, 53, 100.00, NULL, NULL, NULL, 100),
(22, 54, 250.00, NULL, NULL, NULL, 250),
(22, 55, 500.00, NULL, NULL, NULL, 500),
(22, 56, 1000.00, NULL, NULL, NULL, 1000),
(22, 58, 200.00, NULL, NULL, NULL, 200),
(22, 59, 30.00, NULL, NULL, NULL, 30),
(22, 60, 10.00, NULL, NULL, NULL, 10);

-- --------------------------------------------------------

--
-- Table structure for table `employee_schedules`
--

CREATE TABLE `employee_schedules` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `booth_id` int(11) NOT NULL,
  `shift` enum('pagi','malam') NOT NULL,
  `expected_clock_in` time NOT NULL,
  `expected_clock_out` time NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee_schedules`
--

INSERT INTO `employee_schedules` (`id`, `employee_id`, `booth_id`, `shift`, `expected_clock_in`, `expected_clock_out`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(14, 17, 10, 'pagi', '09:00:00', '16:00:00', 1, 1, '2026-06-11 00:18:14', '2026-06-11 00:18:14'),
(15, 4, 1, 'pagi', '08:00:00', '14:00:00', 1, 1, '2026-06-11 00:19:47', '2026-06-11 00:19:47'),
(16, 7, 2, 'pagi', '11:00:00', '17:00:00', 1, 1, '2026-06-11 00:20:03', '2026-06-11 00:20:03'),
(17, 8, 6, 'pagi', '10:00:00', '16:00:00', 1, 1, '2026-06-11 00:20:41', '2026-06-11 00:20:41'),
(18, 6, 3, 'pagi', '10:00:00', '16:00:00', 1, 1, '2026-06-11 00:22:21', '2026-06-11 00:22:21'),
(19, 12, 2, 'pagi', '08:00:00', '14:00:00', 1, 1, '2026-06-11 01:29:50', '2026-06-11 02:01:37');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('Bahan Baku','Packaging','Lainnya','Mixing') NOT NULL,
  `avg_price` decimal(14,3) DEFAULT NULL,
  `last_price` decimal(14,3) DEFAULT NULL,
  `unit` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `name`, `category`, `avg_price`, `last_price`, `unit`, `is_active`, `updated_at`) VALUES
(47, 'Bubuk Coklat A', 'Bahan Baku', 189.000, 189.000, 'gram', 1, '2026-06-09 20:43:29'),
(48, 'Bubuk Coklat B', 'Bahan Baku', 150.000, 150.000, 'gram', 1, '2026-06-09 20:43:29'),
(49, 'Susu Diamond 1 L', 'Bahan Baku', 19.750, 19.750, 'ml', 1, '2026-06-10 23:43:13'),
(50, 'SKM Carnation 488gr', 'Bahan Baku', 17708.333, 17708.333, 'pcs', 1, '2026-06-10 23:43:13'),
(51, 'Air Galon', 'Bahan Baku', 0.471, 0.471, 'ml', 1, '2026-06-11 02:30:32'),
(52, 'Es Batu', 'Bahan Baku', 1.400, 1.400, 'gram', 1, '2026-06-11 02:30:32'),
(53, 'Kresek', 'Packaging', 120.000, 120.000, 'pcs', 1, '2026-06-10 23:43:13'),
(54, 'Sedotan', 'Packaging', 48.000, 48.000, 'pcs', 1, '2026-06-10 23:43:13'),
(55, 'Tisu', 'Lainnya', 24.000, 24.000, 'pcs', 1, '2026-06-10 23:46:05'),
(56, 'Cup Sealer', 'Packaging', 0.023, 0.023, 'pcs', 1, '2026-06-10 23:43:13'),
(57, 'Bubuk Coklat Choco Celuv', 'Mixing', NULL, NULL, 'gram', 1, '2026-06-09 20:32:49'),
(58, 'Cup 14 oz', 'Packaging', 995.000, 995.000, 'pcs', 1, '2026-06-10 13:53:25'),
(59, 'Cup 16 oz', 'Packaging', 1049.000, 1049.000, 'pcs', 1, '2026-06-10 13:53:25'),
(60, 'Cup 18 oz', 'Packaging', 122.400, 122.400, 'pcs', 1, '2026-06-10 13:53:25');

-- --------------------------------------------------------

--
-- Table structure for table `productions`
--

CREATE TABLE `productions` (
  `id` int(11) NOT NULL,
  `booth_id` int(11) DEFAULT NULL,
  `recipe_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `qty` decimal(10,2) DEFAULT NULL,
  `loc_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `productions`
--

INSERT INTO `productions` (`id`, `booth_id`, `recipe_id`, `created_by`, `qty`, `loc_id`, `created_at`) VALUES
(17, NULL, 8, 1, 3.00, 1, '2026-06-10 23:16:45'),
(18, 2, 9, 12, 1.00, 3, '2026-06-11 02:31:25');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `recipe_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `size` enum('kecil','sedang','jumbo') NOT NULL,
  `price` decimal(14,3) NOT NULL,
  `adonan_ml` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `recipe_id`, `name`, `size`, `price`, `adonan_ml`, `is_active`, `created_at`) VALUES
(4, 9, 'Choco celuv', 'kecil', 6000.000, 200.00, 1, '2026-06-10 23:56:26'),
(5, 9, 'Choco celuv', 'sedang', 8000.000, 220.00, 1, '2026-06-10 23:56:56'),
(6, 9, 'Choco celuv', 'jumbo', 10000.000, 250.00, 1, '2026-06-10 23:57:16');

-- --------------------------------------------------------

--
-- Table structure for table `product_components`
--

CREATE TABLE `product_components` (
  `product_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `qty` decimal(10,2) NOT NULL,
  `applies_to` enum('all','regular','less_ice') NOT NULL DEFAULT 'all'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_components`
--

INSERT INTO `product_components` (`product_id`, `item_id`, `qty`, `applies_to`) VALUES
(4, 52, 150.00, 'regular'),
(4, 52, 75.00, 'less_ice'),
(4, 53, 1.00, 'all'),
(4, 54, 1.00, 'all'),
(4, 55, 5.00, 'all'),
(4, 56, 1.00, 'all'),
(4, 58, 1.00, 'all'),
(5, 52, 200.00, 'regular'),
(5, 52, 100.00, 'less_ice'),
(5, 53, 1.00, 'all'),
(5, 54, 1.00, 'all'),
(5, 55, 5.00, 'all'),
(5, 56, 1.00, 'all'),
(5, 59, 1.00, 'all'),
(6, 52, 300.00, 'regular'),
(6, 52, 100.00, 'less_ice'),
(6, 53, 1.00, 'all'),
(6, 54, 1.00, 'all'),
(6, 55, 5.00, 'all'),
(6, 56, 1.00, 'all'),
(6, 60, 1.00, 'all');

-- --------------------------------------------------------

--
-- Table structure for table `purchases`
--

CREATE TABLE `purchases` (
  `id` int(11) NOT NULL,
  `supplier` varchar(30) NOT NULL,
  `loc_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `type` enum('warehouse','booth') DEFAULT NULL,
  `date` date NOT NULL,
  `total` decimal(14,3) NOT NULL,
  `status` enum('dikonfirmasi','dibatalkan') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `cancelled_by` int(11) DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchases`
--

INSERT INTO `purchases` (`id`, `supplier`, `loc_id`, `created_by`, `type`, `date`, `total`, `status`, `created_at`, `cancelled_by`, `cancelled_at`) VALUES
(22, 'Toko Aneka ', 1, 1, 'warehouse', '2026-06-09', 24450000.000, 'dikonfirmasi', '2026-06-09 20:43:29', NULL, NULL),
(23, 'Percetakan Surya', 1, 1, 'warehouse', '2026-06-01', 2575700.000, 'dikonfirmasi', '2026-06-10 13:53:25', NULL, NULL),
(24, 'Tentrem Baru', 1, 1, 'warehouse', '2026-06-04', 2735460.000, 'dikonfirmasi', '2026-06-10 23:43:13', NULL, NULL),
(25, 'tiktok promo', 1, 1, 'warehouse', '2026-06-06', 216000.000, 'dikonfirmasi', '2026-06-10 23:46:05', NULL, NULL),
(26, 'Booth Purchase', 3, 12, 'booth', '2026-06-11', 15000.000, 'dikonfirmasi', '2026-06-11 02:30:32', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_items`
--

CREATE TABLE `purchase_items` (
  `purchase_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `buy_unit` varchar(50) DEFAULT NULL,
  `buy_qty` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_items`
--

INSERT INTO `purchase_items` (`purchase_id`, `item_id`, `unit_price`, `total_price`, `buy_unit`, `buy_qty`) VALUES
(22, 47, 945000.00, 9450000.00, 'dus', 10.00),
(22, 48, 750000.00, 15000000.00, 'dus', 20.00),
(23, 58, 497500.00, 1990000.00, 'paket', 4.00),
(23, 59, 524500.00, 524500.00, 'paket', 1.00),
(23, 60, 61200.00, 61200.00, 'paket', 1.00),
(24, 49, 237000.00, 711000.00, 'dus', 3.00),
(24, 50, 850000.00, 1700000.00, 'dus', 2.00),
(24, 53, 72000.00, 144000.00, 'lusin', 2.00),
(24, 54, 12000.00, 180000.00, 'pak', 15.00),
(24, 56, 23.00, 460.00, 'roll', 20.00),
(25, 55, 72000.00, 216000.00, 'ball', 3.00),
(26, 51, 8000.00, 8000.00, 'galon', 1.00),
(26, 52, 7000.00, 7000.00, 'kantong', 1.00);

-- --------------------------------------------------------

--
-- Table structure for table `recipes`
--

CREATE TABLE `recipes` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('mix','adonan') NOT NULL,
  `output_id` int(11) DEFAULT NULL,
  `output_qty` int(11) NOT NULL,
  `output_unit` varchar(30) NOT NULL,
  `expiry_hours` float DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recipes`
--

INSERT INTO `recipes` (`id`, `name`, `type`, `output_id`, `output_qty`, `output_unit`, `expiry_hours`, `notes`, `is_active`) VALUES
(8, 'Bubuk Coklat Choco Celuv', 'mix', 57, 3000, 'gram', NULL, NULL, 1),
(9, 'Coklat kental Choco Celuv', 'adonan', NULL, 2700, 'ml', 7, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `recipe_items`
--

CREATE TABLE `recipe_items` (
  `id` int(11) NOT NULL,
  `recipe_id` int(11) DEFAULT NULL,
  `item_id` int(11) DEFAULT NULL,
  `qty` decimal(10,2) DEFAULT NULL,
  `unit` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `recipe_items`
--

INSERT INTO `recipe_items` (`id`, `recipe_id`, `item_id`, `qty`, `unit`) VALUES
(42, 8, 47, 1000.00, 'gram'),
(43, 8, 48, 2000.00, 'gram'),
(44, 9, 51, 2000.00, 'ml'),
(45, 9, 50, 1.00, 'pcs'),
(46, 9, 57, 200.00, 'gram'),
(47, 9, 49, 200.00, 'ml');

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` int(11) NOT NULL,
  `booth_id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `payment_method` enum('tunai','qris') NOT NULL DEFAULT 'tunai',
  `grand_total` decimal(14,3) NOT NULL DEFAULT 0.000
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sale_items`
--

CREATE TABLE `sale_items` (
  `sale_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `is_less_ice` tinyint(1) NOT NULL DEFAULT 0,
  `unit_price` decimal(14,3) NOT NULL,
  `total_price` decimal(14,3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_corrections`
--

CREATE TABLE `stock_corrections` (
  `id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `qty` decimal(10,2) NOT NULL,
  `movement_type` enum('IN','OUT') NOT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_locations`
--

CREATE TABLE `stock_locations` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('warehouse','booth') NOT NULL,
  `booth_id` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_locations`
--

INSERT INTO `stock_locations` (`id`, `name`, `type`, `booth_id`, `updated_at`) VALUES
(1, 'Gudang Pusat', 'warehouse', 0, '2026-04-22 07:54:26'),
(2, 'Gudang Kebonrojo', 'booth', 1, '2026-04-22 09:38:39'),
(3, 'Gudang Pasar Banggle', 'booth', 2, '2026-04-22 09:38:39'),
(4, 'Gudang Pasar Templek', 'booth', 4, '2026-05-04 09:31:08'),
(5, 'Gudang Pasar Legiii', 'booth', 3, '2026-05-04 09:31:48'),
(6, 'Gudang Tanjung', 'booth', 5, '2026-05-05 20:26:55'),
(7, 'Gudang Talun', 'booth', 6, '2026-05-15 07:46:18'),
(8, 'Gudang Ponggok', 'booth', 7, '2026-05-20 07:05:47'),
(9, 'Gudang pandan', 'booth', 8, '2026-05-30 13:39:54'),
(10, 'Gudang Kademangan', 'booth', 9, '2026-06-09 20:30:20'),
(11, 'Gudang Tes Unisba', 'booth', 10, '2026-06-11 00:13:26');

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `id` bigint(20) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `qty` decimal(10,2) DEFAULT NULL,
  `movement_type` enum('IN','OUT') DEFAULT NULL,
  `source_type` enum('PEMBELIAN','PENJUALAN','DISTRIBUSI','KOREKSI','PRODUKSI','PEMBATALAN PEMBELIAN','PEMBATALAN DISTRIBUSI') DEFAULT NULL,
  `source_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `saldo_after` decimal(12,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_movements`
--

INSERT INTO `stock_movements` (`id`, `item_id`, `location_id`, `qty`, `movement_type`, `source_type`, `source_id`, `created_at`, `saldo_after`) VALUES
(1, 47, 1, 50000.00, 'IN', 'PEMBELIAN', 22, '2026-06-09 20:43:29', 50000.00),
(2, 48, 1, 100000.00, 'IN', 'PEMBELIAN', 22, '2026-06-09 20:43:29', 100000.00),
(3, 58, 1, 2000.00, 'IN', 'PEMBELIAN', 23, '2026-06-10 13:53:25', 2000.00),
(4, 59, 1, 500.00, 'IN', 'PEMBELIAN', 23, '2026-06-10 13:53:25', 500.00),
(5, 60, 1, 500.00, 'IN', 'PEMBELIAN', 23, '2026-06-10 13:53:25', 500.00),
(6, 47, 1, 3000.00, 'OUT', 'PRODUKSI', 16, '2026-06-10 23:11:39', 47000.00),
(7, 48, 1, 6000.00, 'OUT', 'PRODUKSI', 16, '2026-06-10 23:11:39', 94000.00),
(8, 57, 1, 9000.00, 'IN', 'PRODUKSI', 16, '2026-06-10 23:11:39', 9000.00),
(9, 47, 1, 3000.00, 'IN', 'PRODUKSI', 16, '2026-06-10 23:16:33', 50000.00),
(10, 48, 1, 6000.00, 'IN', 'PRODUKSI', 16, '2026-06-10 23:16:33', 100000.00),
(11, 57, 1, 9000.00, 'OUT', 'PRODUKSI', 16, '2026-06-10 23:16:33', 0.00),
(12, 47, 1, 3000.00, 'OUT', 'PRODUKSI', 17, '2026-06-10 23:16:45', 47000.00),
(13, 48, 1, 6000.00, 'OUT', 'PRODUKSI', 17, '2026-06-10 23:16:45', 94000.00),
(14, 57, 1, 9000.00, 'IN', 'PRODUKSI', 17, '2026-06-10 23:16:45', 9000.00),
(15, 50, 1, 96.00, 'IN', 'PEMBELIAN', 24, '2026-06-10 23:43:13', 96.00),
(16, 49, 1, 36000.00, 'IN', 'PEMBELIAN', 24, '2026-06-10 23:43:13', 36000.00),
(17, 53, 1, 1200.00, 'IN', 'PEMBELIAN', 24, '2026-06-10 23:43:13', 1200.00),
(18, 54, 1, 3750.00, 'IN', 'PEMBELIAN', 24, '2026-06-10 23:43:13', 3750.00),
(19, 56, 1, 20000.00, 'IN', 'PEMBELIAN', 24, '2026-06-10 23:43:13', 20000.00),
(20, 55, 1, 9000.00, 'IN', 'PEMBELIAN', 25, '2026-06-10 23:46:05', 9000.00),
(29, 57, 1, 1600.00, 'OUT', 'DISTRIBUSI', 21, '2026-06-11 00:47:55', 7400.00),
(32, 57, 3, 1600.00, 'IN', 'DISTRIBUSI', 21, '2026-06-11 02:01:45', 1600.00),
(33, 55, 1, 500.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:04', 8500.00),
(34, 49, 1, 2000.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:04', 34000.00),
(35, 50, 1, 25.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:04', 71.00),
(36, 53, 1, 100.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:04', 1100.00),
(37, 54, 1, 250.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:04', 3500.00),
(38, 56, 1, 1000.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:04', 19000.00),
(39, 58, 1, 200.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:04', 1800.00),
(40, 59, 1, 30.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:04', 470.00),
(41, 60, 1, 10.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:04', 490.00),
(42, 49, 1, 2000.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:22', 0.00),
(43, 50, 1, 25.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:22', 0.00),
(44, 53, 1, 100.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:22', 0.00),
(45, 54, 1, 250.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:22', 0.00),
(46, 55, 1, 500.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:22', 0.00),
(47, 56, 1, 1000.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:22', 0.00),
(48, 58, 1, 200.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:22', 0.00),
(49, 59, 1, 30.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:22', 0.00),
(50, 60, 1, 10.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:22', 0.00),
(51, 49, 1, 2000.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(52, 49, 3, 2000.00, 'IN', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(53, 50, 1, 25.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(54, 50, 3, 25.00, 'IN', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(55, 53, 1, 100.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(56, 53, 3, 100.00, 'IN', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(57, 54, 1, 250.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(58, 54, 3, 250.00, 'IN', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(59, 55, 1, 500.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(60, 55, 3, 500.00, 'IN', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(61, 56, 1, 1000.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(62, 56, 3, 1000.00, 'IN', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(63, 58, 1, 200.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(64, 58, 3, 200.00, 'IN', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(65, 59, 1, 30.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(66, 59, 3, 30.00, 'IN', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(67, 60, 1, 10.00, 'OUT', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(68, 60, 3, 10.00, 'IN', 'DISTRIBUSI', 22, '2026-06-11 02:05:38', 0.00),
(69, 52, 3, 5000.00, 'IN', 'PEMBELIAN', 26, '2026-06-11 02:30:32', 5000.00),
(70, 51, 3, 17000.00, 'IN', 'PEMBELIAN', 26, '2026-06-11 02:30:32', 17000.00),
(71, 51, 3, 2000.00, 'OUT', 'PRODUKSI', 18, '2026-06-11 02:31:25', 15000.00),
(72, 50, 3, 1.00, 'OUT', 'PRODUKSI', 18, '2026-06-11 02:31:25', -1.00),
(73, 57, 3, 200.00, 'OUT', 'PRODUKSI', 18, '2026-06-11 02:31:25', 1400.00),
(74, 49, 3, 200.00, 'OUT', 'PRODUKSI', 18, '2026-06-11 02:31:25', -200.00);

-- --------------------------------------------------------

--
-- Table structure for table `stock_per_location`
--

CREATE TABLE `stock_per_location` (
  `item_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `current_stock` decimal(10,2) DEFAULT NULL,
  `safety_stock` decimal(10,2) DEFAULT NULL,
  `min_qty` decimal(10,2) DEFAULT NULL,
  `max_qty` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `can_purchase` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_per_location`
--

INSERT INTO `stock_per_location` (`item_id`, `location_id`, `current_stock`, `safety_stock`, `min_qty`, `max_qty`, `is_active`, `can_purchase`) VALUES
(47, 1, 47000.00, 200.00, 3000.00, 10000.00, 1, 0),
(47, 2, 0.00, 0.00, 0.00, 0.00, 0, 0),
(47, 3, 0.00, 0.00, 0.00, 0.00, 0, 0),
(47, 4, 0.00, 0.00, 0.00, 0.00, 0, 0),
(47, 5, 0.00, 0.00, 0.00, 0.00, 0, 0),
(47, 6, 0.00, 0.00, 0.00, 0.00, 0, 0),
(47, 7, 0.00, 0.00, 0.00, 0.00, 0, 0),
(47, 8, 0.00, 0.00, 0.00, 0.00, 0, 0),
(47, 9, 0.00, 0.00, 0.00, 0.00, 0, 0),
(47, 10, 0.00, NULL, 0.00, 0.00, 1, 0),
(47, 11, 0.00, NULL, 0.00, 0.00, 1, 0),
(48, 1, 94000.00, 360.00, 6000.00, 17000.00, 1, 0),
(48, 2, 0.00, 0.00, 0.00, 0.00, 0, 0),
(48, 3, 0.00, 0.00, 0.00, 0.00, 0, 0),
(48, 4, 0.00, 0.00, 0.00, 0.00, 0, 0),
(48, 5, 0.00, 0.00, 0.00, 0.00, 0, 0),
(48, 6, 0.00, 0.00, 0.00, 0.00, 0, 0),
(48, 7, 0.00, 0.00, 0.00, 0.00, 0, 0),
(48, 8, 0.00, 0.00, 0.00, 0.00, 0, 0),
(48, 9, 0.00, 0.00, 0.00, 0.00, 0, 0),
(48, 10, 0.00, NULL, 0.00, 0.00, 1, 0),
(48, 11, 0.00, NULL, 0.00, 0.00, 1, 0),
(49, 1, 30000.00, 1000.00, 15000.00, 60000.00, 1, 0),
(49, 2, 0.00, 0.00, 0.00, 0.00, 1, 0),
(49, 3, -200.00, 0.00, 0.00, 0.00, 1, 0),
(49, 4, 0.00, 0.00, 0.00, 0.00, 1, 0),
(49, 5, 0.00, 0.00, 0.00, 0.00, 1, 0),
(49, 6, 0.00, 0.00, 0.00, 0.00, 1, 0),
(49, 7, 0.00, 0.00, 0.00, 0.00, 1, 0),
(49, 8, 0.00, 0.00, 0.00, 0.00, 1, 0),
(49, 9, 0.00, 0.00, 0.00, 0.00, 1, 0),
(49, 10, 0.00, NULL, 0.00, 0.00, 1, 0),
(49, 11, 0.00, NULL, 0.00, 0.00, 1, 0),
(50, 1, 21.00, 10.00, 20.00, 200.00, 1, 0),
(50, 2, 0.00, 0.00, 0.00, 0.00, 1, 0),
(50, 3, -1.00, 0.00, 0.00, 0.00, 1, 0),
(50, 4, 0.00, 0.00, 0.00, 0.00, 1, 0),
(50, 5, 0.00, 0.00, 0.00, 0.00, 1, 0),
(50, 6, 0.00, 0.00, 0.00, 0.00, 1, 0),
(50, 7, 0.00, 0.00, 0.00, 0.00, 1, 0),
(50, 8, 0.00, 0.00, 0.00, 0.00, 1, 0),
(50, 9, 0.00, 0.00, 0.00, 0.00, 1, 0),
(50, 10, 0.00, NULL, 0.00, 0.00, 1, 0),
(50, 11, 0.00, NULL, 0.00, 0.00, 1, 0),
(51, 1, 0.00, 0.00, 0.00, 0.00, 1, 0),
(51, 2, 0.00, 0.00, 0.00, 0.00, 1, 1),
(51, 3, 15000.00, 1000.00, 5000.00, 20000.00, 1, 1),
(51, 4, 0.00, 0.00, 0.00, 0.00, 1, 1),
(51, 5, 0.00, 0.00, 0.00, 0.00, 1, 1),
(51, 6, 0.00, 0.00, 0.00, 0.00, 1, 1),
(51, 7, 0.00, 0.00, 0.00, 0.00, 1, 1),
(51, 8, 0.00, 0.00, 0.00, 0.00, 1, 1),
(51, 9, 0.00, 0.00, 0.00, 0.00, 1, 1),
(51, 10, 0.00, 0.00, 0.00, 0.00, 1, 1),
(51, 11, 0.00, 0.00, 0.00, 0.00, 1, 1),
(52, 1, 0.00, 0.00, 0.00, 0.00, 1, 0),
(52, 2, 0.00, 0.00, 0.00, 0.00, 1, 1),
(52, 3, 5000.00, 0.00, 0.00, 0.00, 1, 1),
(52, 4, 0.00, 0.00, 0.00, 0.00, 1, 1),
(52, 5, 0.00, 0.00, 0.00, 0.00, 1, 1),
(52, 6, 0.00, 0.00, 0.00, 0.00, 1, 1),
(52, 7, 0.00, 0.00, 0.00, 0.00, 1, 1),
(52, 8, 0.00, 0.00, 0.00, 0.00, 1, 1),
(52, 9, 0.00, 0.00, 0.00, 0.00, 1, 1),
(52, 10, 0.00, 0.00, 0.00, 0.00, 1, 1),
(52, 11, 0.00, 0.00, 0.00, 0.00, 1, 1),
(53, 1, 900.00, 0.00, 0.00, 0.00, 1, 0),
(53, 2, 0.00, 0.00, 0.00, 0.00, 1, 0),
(53, 3, 100.00, 0.00, 0.00, 0.00, 1, 0),
(53, 4, 0.00, 0.00, 0.00, 0.00, 1, 0),
(53, 5, 0.00, 0.00, 0.00, 0.00, 1, 0),
(53, 6, 0.00, 0.00, 0.00, 0.00, 1, 0),
(53, 7, 0.00, 0.00, 0.00, 0.00, 1, 0),
(53, 8, 0.00, 0.00, 0.00, 0.00, 1, 0),
(53, 9, 0.00, 0.00, 0.00, 0.00, 1, 0),
(53, 10, 0.00, NULL, 0.00, 0.00, 1, 0),
(53, 11, 0.00, NULL, 0.00, 0.00, 1, 0),
(54, 1, 3000.00, 500.00, 1000.00, 5000.00, 1, 0),
(54, 2, 0.00, 0.00, 0.00, 0.00, 1, 0),
(54, 3, 250.00, 0.00, 0.00, 0.00, 1, 1),
(54, 4, 0.00, 0.00, 0.00, 0.00, 1, 0),
(54, 5, 0.00, 0.00, 0.00, 0.00, 1, 0),
(54, 6, 0.00, 0.00, 0.00, 0.00, 1, 0),
(54, 7, 0.00, 0.00, 0.00, 0.00, 1, 0),
(54, 8, 0.00, 0.00, 0.00, 0.00, 1, 0),
(54, 9, 0.00, 0.00, 0.00, 0.00, 1, 0),
(54, 10, 0.00, NULL, 0.00, 0.00, 1, 0),
(54, 11, 0.00, NULL, 0.00, 0.00, 1, 0),
(55, 1, 7500.00, 0.00, 0.00, 0.00, 1, 0),
(55, 2, 0.00, 0.00, 0.00, 0.00, 1, 0),
(55, 3, 500.00, 0.00, 0.00, 0.00, 1, 0),
(55, 4, 0.00, 0.00, 0.00, 0.00, 1, 0),
(55, 5, 0.00, 0.00, 0.00, 0.00, 1, 0),
(55, 6, 0.00, 0.00, 0.00, 0.00, 1, 0),
(55, 7, 0.00, 0.00, 0.00, 0.00, 1, 0),
(55, 8, 0.00, 0.00, 0.00, 0.00, 1, 0),
(55, 9, 0.00, 0.00, 0.00, 0.00, 1, 0),
(55, 10, 0.00, NULL, 0.00, 0.00, 1, 0),
(55, 11, 0.00, NULL, 0.00, 0.00, 1, 0),
(56, 1, 17000.00, 1000.00, 1000.00, 16000.00, 1, 0),
(56, 2, 0.00, 0.00, 0.00, 0.00, 1, 0),
(56, 3, 1000.00, 0.00, 0.00, 0.00, 1, 0),
(56, 4, 0.00, 0.00, 0.00, 0.00, 1, 0),
(56, 5, 0.00, 0.00, 0.00, 0.00, 1, 0),
(56, 6, 0.00, 0.00, 0.00, 0.00, 1, 0),
(56, 7, 0.00, 0.00, 0.00, 0.00, 1, 0),
(56, 8, 0.00, 0.00, 0.00, 0.00, 1, 0),
(56, 9, 0.00, 0.00, 0.00, 0.00, 1, 0),
(56, 10, 0.00, NULL, 0.00, 0.00, 1, 0),
(56, 11, 0.00, NULL, 0.00, 0.00, 1, 0),
(57, 1, 7400.00, 1000.00, 3000.00, 25000.00, 1, 0),
(57, 2, 0.00, 0.00, 0.00, 0.00, 1, 0),
(57, 3, 1400.00, 0.00, 0.00, 0.00, 1, 0),
(57, 4, 0.00, 0.00, 0.00, 0.00, 1, 0),
(57, 5, 0.00, 0.00, 0.00, 0.00, 1, 0),
(57, 6, 0.00, 0.00, 0.00, 0.00, 1, 0),
(57, 7, 0.00, 0.00, 0.00, 0.00, 1, 0),
(57, 8, 0.00, 0.00, 0.00, 0.00, 1, 0),
(57, 9, 0.00, 0.00, 0.00, 0.00, 1, 0),
(57, 10, 0.00, 0.00, 0.00, 0.00, 1, 0),
(57, 11, 0.00, NULL, 0.00, 0.00, 1, 0),
(58, 1, 1400.00, 100.00, 500.00, 2500.00, 1, 0),
(58, 2, 0.00, 0.00, 0.00, 0.00, 1, 0),
(58, 3, 200.00, 0.00, 0.00, 0.00, 1, 0),
(58, 4, 0.00, 0.00, 0.00, 0.00, 1, 0),
(58, 5, 0.00, 0.00, 0.00, 0.00, 1, 0),
(58, 6, 0.00, 0.00, 0.00, 0.00, 1, 0),
(58, 7, 0.00, 0.00, 0.00, 0.00, 1, 0),
(58, 8, 0.00, 0.00, 0.00, 0.00, 1, 0),
(58, 9, 0.00, 0.00, 0.00, 0.00, 1, 0),
(58, 10, 0.00, 0.00, 0.00, 0.00, 1, 0),
(58, 11, 0.00, NULL, 0.00, 0.00, 1, 0),
(59, 1, 410.00, 20.00, 50.00, 550.00, 1, 0),
(59, 2, 0.00, 0.00, 0.00, 0.00, 1, 0),
(59, 3, 30.00, 0.00, 0.00, 0.00, 1, 0),
(59, 4, 0.00, 0.00, 0.00, 0.00, 1, 0),
(59, 5, 0.00, 0.00, 0.00, 0.00, 1, 0),
(59, 6, 0.00, 0.00, 0.00, 0.00, 1, 0),
(59, 7, 0.00, 0.00, 0.00, 0.00, 1, 0),
(59, 8, 0.00, 0.00, 0.00, 0.00, 1, 0),
(59, 9, 0.00, 0.00, 0.00, 0.00, 1, 0),
(59, 10, 0.00, 0.00, 0.00, 0.00, 1, 0),
(59, 11, 0.00, NULL, 0.00, 0.00, 1, 0),
(60, 1, 470.00, 10.00, 25.00, 525.00, 1, 0),
(60, 2, 0.00, 0.00, 0.00, 0.00, 1, 0),
(60, 3, 10.00, 0.00, 0.00, 0.00, 1, 0),
(60, 4, 0.00, 0.00, 0.00, 0.00, 1, 0),
(60, 5, 0.00, 0.00, 0.00, 0.00, 1, 0),
(60, 6, 0.00, 0.00, 0.00, 0.00, 1, 0),
(60, 7, 0.00, 0.00, 0.00, 0.00, 1, 0),
(60, 8, 0.00, 0.00, 0.00, 0.00, 1, 0),
(60, 9, 0.00, 0.00, 0.00, 0.00, 1, 0),
(60, 10, 0.00, 0.00, 0.00, 0.00, 1, 0),
(60, 11, 0.00, NULL, 0.00, 0.00, 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `unit_conversions`
--

CREATE TABLE `unit_conversions` (
  `id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `buy_unit` varchar(50) DEFAULT NULL,
  `label` varchar(100) DEFAULT NULL,
  `buy_qty` decimal(10,2) NOT NULL,
  `base_unit` varchar(50) DEFAULT NULL,
  `base_qty` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `unit_conversions`
--

INSERT INTO `unit_conversions` (`id`, `item_id`, `buy_unit`, `label`, `buy_qty`, `base_unit`, `base_qty`) VALUES
(43, 56, 'roll', 'Roll 1000', 1.00, 'pcs', 1000.00),
(45, 54, 'pak', 'Pak 250', 1.00, 'pcs', 250.00),
(48, 53, 'pak', 'Pak isi 50', 1.00, 'pcs', 50.00),
(49, 47, 'pak', 'Pak 1/2kg', 1.00, 'gram', 500.00),
(50, 47, 'dus', 'Dus 5kg', 1.00, 'gram', 5000.00),
(51, 48, 'pak', 'Pak 1/2kg', 1.00, 'gram', 500.00),
(52, 48, 'dus', 'Dus 5kg', 1.00, 'gram', 5000.00),
(54, 49, 'pcs', 'Pcs 1L', 1.00, 'ml', 1000.00),
(55, 49, 'dus', 'Dus isi 12', 1.00, 'ml', 12000.00),
(56, 50, 'dus', 'Dus 48', 1.00, 'pcs', 48.00),
(57, 58, 'paket', 'Paket 500', 1.00, 'pcs', 500.00),
(58, 59, 'paket', 'Paket 500', 1.00, 'pcs', 500.00),
(59, 60, 'paket', 'Paket 500', 1.00, 'pcs', 500.00),
(60, 52, 'kantong', 'kantong kecil', 1.00, 'gram', 5000.00),
(61, 51, 'galon', 'Galon', 1.00, 'ml', 17000.00),
(62, 53, 'lusin', 'Lusinan', 1.00, 'pcs', 600.00),
(64, 55, 'ball', 'ball 12', 1.00, 'pcs', 3000.00),
(65, 55, 'pcs', 'pcs', 1.00, 'pcs', 250.00);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `no_hp` varchar(20) NOT NULL,
  `role` enum('pemilik','kurir','penjaga_booth','') NOT NULL,
  `alamat` varchar(255) NOT NULL,
  `entry_date` datetime DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL,
  `is_update` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `username`, `password`, `no_hp`, `role`, `alamat`, `entry_date`, `is_active`, `is_update`, `created_at`) VALUES
(1, 'Shima Fuaziah', 'shima', '$2b$10$ESjFbjepdaZVZV0C2YPZMeyy/uoAcxN44bpumQNfVfg6PSa.CzPCe', '0989989898', 'pemilik', 'Blitar', '2026-04-21 00:00:00', 1, 1, '2026-04-21 14:23:38'),
(3, 'Aziz Kurniawan', 'aziz', '$2b$10$N.8EwPQ94hyNrruYUHXNlerm3bIUWnd9Hx.uG6dNgUpfP5gSm.vKm', '0989989000', 'kurir', 'Blitar', '2026-04-21 00:00:00', 1, 1, '2026-04-21 14:25:55'),
(4, 'Dina', 'dina', '$2b$10$9QMciurjIKhIqdbx9zdC4eOkPnx2sB/59dytzj32tBmj/Q6cSehvG', '03872839399', 'penjaga_booth', 'Blitar', '2026-04-21 00:00:00', 1, 1, '2026-04-21 14:25:55'),
(5, 'Budi', '0089550393', '$2b$10$RAsjhxENAkcTcFm.ca3Nieadh4Xhu8uW0qTNtqu5qWA2JT4.5qb8m', '0089550393', 'penjaga_booth', 'Jalan raya Blitar', '2026-04-01 00:00:00', 1, 1, '2026-04-27 16:37:48'),
(6, 'Sari', '0888999000', '$2b$10$fcZw4LrlIu8HN0NcqW485.lLY5tjo/88QviJEOP12R0ovmq8m/78C', '0888999000', 'penjaga_booth', 'Kabupaten Blitar', '2026-04-01 00:00:00', 1, 1, '2026-04-27 16:44:44'),
(7, 'Fitri Oktasari', '090222038293', '$2b$10$bFERX.laMAM3MyNamFQntuX0PlCIgMignNkT090lCFTF2eahtU2rK', '090222038293', 'penjaga_booth', 'Kademangan', '2026-05-15 00:00:00', 1, 1, '2026-05-15 14:27:16'),
(8, 'Nabila Dwi Astuti', '092320320333', '$2b$10$cLu6b9cBmJqHC4WnBaiQ/OdBlbP3zfcpIFUS7sAJTCnfRGNJ3HRCa', '092320320333', 'penjaga_booth', 'Lodoyo', '2026-05-15 00:00:00', 1, 0, '2026-05-15 14:34:20'),
(12, 'Nadia Putri Lestari', '090324044434', '$2b$10$v4z4awFCKptOaANiQUqdCOPIs30Oqcaja8LPX1Nsg/kBGo/VfuqFi', '090324044434', 'penjaga_booth', 'Jl Melati', '2026-05-15 00:00:00', 1, 1, '2026-05-15 14:40:07'),
(17, 'Tes penjaga', '12345678', '$2b$10$sTKevm.sZ6Devd/VNjGQSO2tJEt9KuJxva3fSLiVqN2gTYxoRg5SW', '12345678', 'penjaga_booth', 'Kab Blitar', '2026-06-05 00:00:00', 1, 0, '2026-06-11 07:16:57'),
(18, 'Tes Kurir', '09876543', '$2b$10$xws.AfObxIzVtjsCACa0S.JBgivZUMC6B6swXTzkk/p8HJCGedTw.', '09876543', 'kurir', 'Kota Blitar', '2026-06-07 00:00:00', 1, 0, '2026-06-11 07:17:35');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `booth_id` (`booth_id`),
  ADD KEY `schedule_id` (`schedule_id`),
  ADD KEY `att_ibfk_4` (`created_by`);

--
-- Indexes for table `batches`
--
ALTER TABLE `batches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booth_id` (`booth_id`),
  ADD KEY `recipe_id` (`recipe_id`),
  ADD KEY `batches_ibfk_3` (`production_id`),
  ADD KEY `batches_ibfk_4` (`location_id`);

--
-- Indexes for table `booth`
--
ALTER TABLE `booth`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `distributions`
--
ALTER TABLE `distributions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `distributions_ibfk_1` (`kurir_id`),
  ADD KEY `to_location_id` (`to_location_id`),
  ADD KEY `confirmed_by_booth` (`confirmed_by_booth`),
  ADD KEY `confirmed_by_kurir` (`confirmed_by_kurir`);

--
-- Indexes for table `distribution_items`
--
ALTER TABLE `distribution_items`
  ADD PRIMARY KEY (`distribution_id`,`item_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `employee_schedules`
--
ALTER TABLE `employee_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `booth_id` (`booth_id`),
  ADD KEY `es_ibfk_3` (`created_by`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `productions`
--
ALTER TABLE `productions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booth_id` (`booth_id`),
  ADD KEY `recipe_id` (`recipe_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `loc_id` (`loc_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `prod_ibfk_1` (`recipe_id`);

--
-- Indexes for table `product_components`
--
ALTER TABLE `product_components`
  ADD PRIMARY KEY (`product_id`,`item_id`,`applies_to`),
  ADD KEY `pc_ibfk_2` (`item_id`);

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `loc_id` (`loc_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD PRIMARY KEY (`purchase_id`,`item_id`),
  ADD KEY `purchase_id` (`purchase_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `recipes`
--
ALTER TABLE `recipes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `recipe_items`
--
ALTER TABLE `recipe_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recipe_id` (`recipe_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sales_ibfk_1` (`booth_id`),
  ADD KEY `sales_ibfk_2` (`batch_id`),
  ADD KEY `sales_ibfk_3` (`created_by`);

--
-- Indexes for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`sale_id`,`product_id`,`is_less_ice`),
  ADD KEY `si_ibfk_2` (`product_id`);

--
-- Indexes for table `stock_corrections`
--
ALTER TABLE `stock_corrections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `location_id` (`location_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `stock_locations`
--
ALTER TABLE `stock_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booth_id` (`booth_id`);

--
-- Indexes for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `location_id` (`location_id`),
  ADD KEY `idx_stock_item_location` (`item_id`,`location_id`),
  ADD KEY `idx_stock_created` (`created_at`),
  ADD KEY `source_id` (`source_id`),
  ADD KEY `idx_sm_item_loc` (`item_id`,`location_id`,`id`);

--
-- Indexes for table `stock_per_location`
--
ALTER TABLE `stock_per_location`
  ADD PRIMARY KEY (`item_id`,`location_id`),
  ADD KEY `location_id` (`location_id`);

--
-- Indexes for table `unit_conversions`
--
ALTER TABLE `unit_conversions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `no_hp` (`no_hp`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `batches`
--
ALTER TABLE `batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `booth`
--
ALTER TABLE `booth`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `distributions`
--
ALTER TABLE `distributions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `employee_schedules`
--
ALTER TABLE `employee_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `productions`
--
ALTER TABLE `productions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `recipes`
--
ALTER TABLE `recipes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `recipe_items`
--
ALTER TABLE `recipe_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `stock_corrections`
--
ALTER TABLE `stock_corrections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_locations`
--
ALTER TABLE `stock_locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `stock_movements`
--
ALTER TABLE `stock_movements`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT for table `unit_conversions`
--
ALTER TABLE `unit_conversions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `att_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `att_ibfk_2` FOREIGN KEY (`booth_id`) REFERENCES `booth` (`id`),
  ADD CONSTRAINT `att_ibfk_3` FOREIGN KEY (`schedule_id`) REFERENCES `employee_schedules` (`id`),
  ADD CONSTRAINT `att_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `batches`
--
ALTER TABLE `batches`
  ADD CONSTRAINT `batches_ibfk_1` FOREIGN KEY (`booth_id`) REFERENCES `booth` (`id`),
  ADD CONSTRAINT `batches_ibfk_2` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`),
  ADD CONSTRAINT `batches_ibfk_3` FOREIGN KEY (`production_id`) REFERENCES `productions` (`id`),
  ADD CONSTRAINT `batches_ibfk_4` FOREIGN KEY (`location_id`) REFERENCES `stock_locations` (`id`);

--
-- Constraints for table `distributions`
--
ALTER TABLE `distributions`
  ADD CONSTRAINT `distributions_ibfk_1` FOREIGN KEY (`to_location_id`) REFERENCES `stock_locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `distributions_ibfk_2` FOREIGN KEY (`confirmed_by_booth`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `distributions_ibfk_3` FOREIGN KEY (`confirmed_by_kurir`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `distribution_items`
--
ALTER TABLE `distribution_items`
  ADD CONSTRAINT `di_ibfk_1` FOREIGN KEY (`distribution_id`) REFERENCES `distributions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `di_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`);

--
-- Constraints for table `employee_schedules`
--
ALTER TABLE `employee_schedules`
  ADD CONSTRAINT `es_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `es_ibfk_2` FOREIGN KEY (`booth_id`) REFERENCES `booth` (`id`),
  ADD CONSTRAINT `es_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `productions`
--
ALTER TABLE `productions`
  ADD CONSTRAINT `productions_ibfk_1` FOREIGN KEY (`booth_id`) REFERENCES `booth` (`id`),
  ADD CONSTRAINT `productions_ibfk_2` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`),
  ADD CONSTRAINT `productions_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `prod_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`);

--
-- Constraints for table `product_components`
--
ALTER TABLE `product_components`
  ADD CONSTRAINT `pc_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `pc_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`);

--
-- Constraints for table `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`loc_id`) REFERENCES `stock_locations` (`id`),
  ADD CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD CONSTRAINT `purchase_items_ibfk_1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `recipe_items`
--
ALTER TABLE `recipe_items`
  ADD CONSTRAINT `recipe_items_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`id`),
  ADD CONSTRAINT `recipe_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`);

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`booth_id`) REFERENCES `booth` (`id`),
  ADD CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`),
  ADD CONSTRAINT `sales_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD CONSTRAINT `si_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `si_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `stock_corrections`
--
ALTER TABLE `stock_corrections`
  ADD CONSTRAINT `stock_corrections_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`),
  ADD CONSTRAINT `stock_corrections_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `stock_locations` (`id`),
  ADD CONSTRAINT `stock_corrections_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`),
  ADD CONSTRAINT `stock_movements_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `stock_locations` (`id`);

--
-- Constraints for table `stock_per_location`
--
ALTER TABLE `stock_per_location`
  ADD CONSTRAINT `stock_per_location_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`),
  ADD CONSTRAINT `stock_per_location_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `stock_locations` (`id`);

--
-- Constraints for table `unit_conversions`
--
ALTER TABLE `unit_conversions`
  ADD CONSTRAINT `unit_conversions_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
