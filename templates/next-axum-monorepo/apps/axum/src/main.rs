use axum_server::{app_router, server_address};

#[tokio::main]
async fn main() {
    let address = server_address().expect("failed to parse server address");
    let listener = tokio::net::TcpListener::bind(address)
        .await
        .expect("failed to bind TCP listener");

    println!("axum server listening on http://{address}");

    axum::serve(listener, app_router())
        .await
        .expect("axum server failed");
}
