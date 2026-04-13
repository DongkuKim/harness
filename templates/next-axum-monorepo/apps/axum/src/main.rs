use std::net::SocketAddr;

use axum_server::app_router;

#[tokio::main]
async fn main() {
    let address = SocketAddr::from(([127, 0, 0, 1], 3001));
    let listener = tokio::net::TcpListener::bind(address)
        .await
        .expect("failed to bind TCP listener");

    println!("axum server listening on http://{address}");

    axum::serve(listener, app_router())
        .await
        .expect("axum server failed");
}
