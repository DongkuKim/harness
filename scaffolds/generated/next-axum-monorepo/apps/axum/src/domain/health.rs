pub fn root_message() -> &'static str {
    "axum server"
}

pub fn health_message() -> &'static str {
    "ok"
}

#[cfg(test)]
mod tests {
    use super::{health_message, root_message};

    #[test]
    fn health_message_is_ok() {
        assert_eq!(health_message(), "ok");
    }

    #[test]
    fn root_message_is_not_empty() {
        assert!(!root_message().is_empty());
    }
}
