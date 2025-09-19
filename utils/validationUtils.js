const { body } = require("express-validator");

const validateFields = (
  EXPECTED_KEYS,
  nestedObjects = {},
  requiredForUpdate = false
) => {
  return body().custom((value) => {
    if (typeof value !== "object" || value === null) {
      throw new Error("Invalid request body, expected an object.");
    }

    // Check for unexpected fields
    const keys = Object.keys(value);
    const invalidKeys = keys.filter((key) => !EXPECTED_KEYS.includes(key));

    if (invalidKeys.length > 0) {
      throw new Error(`Invalid fields: ${invalidKeys.join(", ")}`);
    }

    // Ensure at least one field to update is provided, if required
    if (requiredForUpdate) {
      const updateFields = EXPECTED_KEYS.slice(1);
      const hasUpdateField = updateFields.some(
        (field) => value[field] !== undefined
      );

      if (!hasUpdateField) {
        throw new Error(
          `At least one field (${updateFields.join(
            ", "
          )}) must be provided to update.`
        );
      }
    }

    // Check nested objects
    const checkNestedFields = (parentKey, expectedKeys, parentValue) => {
      if (parentValue && typeof parentValue === "object") {
        const nestedKeys = Object.keys(parentValue);
        const nestedInvalidKeys = nestedKeys.filter(
          (key) => !expectedKeys.includes(key)
        );

        if (nestedInvalidKeys.length > 0) {
          throw new Error(
            `${parentKey}: Invalid fields: ${nestedInvalidKeys.join(", ")}`
          );
        }

        if (requiredForUpdate) {
          const nestedUpdateFields = expectedKeys.slice(1);
          const hasNestedUpdateField = nestedUpdateFields.some(
            (field) => parentValue[field] !== undefined
          );

          if (!hasNestedUpdateField) {
            throw new Error(
              `${parentKey}: At least one field (${nestedUpdateFields.join(
                ", "
              )}) must be provided for update.`
            );
          }
        }
      }
    };

    Object.keys(nestedObjects).forEach((nestedObjectKey) => {
      const expectedNestedFields = nestedObjects[nestedObjectKey];
      if (value[nestedObjectKey]) {
        checkNestedFields(
          nestedObjectKey,
          expectedNestedFields,
          value[nestedObjectKey]
        );
      }
    });

    return true;
  });
};

module.exports = {
  validateFields,
};
