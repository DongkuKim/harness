use axum::{routing::get, Router};

pub fn route_path(segment: &str) -> String {
    if segment.starts_with('/') {
        segment.to_owned()
    } else {
        format!("/{segment}")
    }
}

pub fn app_router() -> Router {
    Router::new()
        .route("/", get(root))
        .route(&route_path("health"), get(health))
}

pub async fn root() -> &'static str {
    "axum server"
}

pub async fn health() -> &'static str {
    "ok"
}

#[cfg(test)]
mod tests {
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use proptest::prelude::*;
    use tower::ServiceExt;

    use super::{app_router, route_path};

    #[tokio::test]
    async fn health_route_returns_ok() {
        let response = app_router()
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    proptest! {
        #[test]
        fn route_path_always_starts_with_a_slash(
            segment in "[a-zA-Z0-9/_-]{1,24}"
        ) {
            prop_assert!(route_path(&segment).starts_with('/'));
        }
    }
}
