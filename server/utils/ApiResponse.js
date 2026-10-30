/**
 * ApiResponse
 * Standard success envelope so every endpoint returns a predictable shape:
 * { success, statusCode, message, data }
 */
class ApiResponse {
  constructor(statusCode, data = null, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  send(res) {
    return res.status(this.statusCode).json(this);
  }
}

module.exports = ApiResponse;
