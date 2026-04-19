pub mod api;
pub mod core;
pub mod domain;

pub use api::router::app_router;
pub use core::config::server_address;
