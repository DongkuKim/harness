use std::net::{AddrParseError, SocketAddr};

const SERVER_ADDRESS: &str = "127.0.0.1:3001";

pub fn server_address() -> Result<SocketAddr, AddrParseError> {
    SERVER_ADDRESS.parse()
}

#[cfg(test)]
mod tests {
    use super::server_address;

    #[test]
    fn server_address_parses_to_the_expected_port() {
        assert_eq!(server_address().unwrap().port(), 3001);
    }
}
