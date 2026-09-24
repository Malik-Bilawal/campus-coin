export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    req[source === "body" ? "body" : source] = result.data;
    next();
  };
}
