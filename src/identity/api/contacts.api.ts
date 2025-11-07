import { createApi } from "@/api/services";
import { ProblemJson, ApiObject } from "@/api/values";
import { withAuth, withIdempotency, withValidation } from "@/api/middlewares";

import {
  addAccountContact,
  AddAccountContactDTO,
  deleteAccountContact,
  updateAccountContact,
  UpdateAccountContactDTO,
} from "@/identity/services";

export const contactsApi = createApi()
  .post(
    "/account/:accountId/contacts",
    withAuth(),
    withIdempotency(),
    withValidation("json", AddAccountContactDTO),
    async (c) => {
      const requestedAccountId = c.req.param("accountId");
      const authenticatedAccountId = c.get("accountId");

      if (requestedAccountId !== authenticatedAccountId) {
        return ProblemJson(c, 404, "Not found");
      }

      const contactResult = await addAccountContact(
        authenticatedAccountId,
        c.req.valid("json")
      );

      if (!contactResult.ok) {
        if (
          contactResult.error.type === "AccountPrimaryContactAlreadyExistsError"
        ) {
          return ProblemJson(
            c,
            400,
            "Primary contact already exists",
            `The primary contact for method '${contactResult.error.contact.method}' already exists. Please use a different method or update the existing contact.`
          );
        }

        throw new Error("Unknown error");
      }

      return c.json(ApiObject("contact", contactResult.value), { status: 201 });
    }
  )
  .post(
    "/account/:accountId/contacts/:contactId",
    withAuth(),
    withIdempotency(),
    withValidation("json", UpdateAccountContactDTO),
    async (c) => {
      const requestedAccountId = c.req.param("accountId");
      const authenticatedAccountId = c.get("accountId");

      if (requestedAccountId !== authenticatedAccountId) {
        return ProblemJson(c, 404, "Not found");
      }

      const updatedContactResult = await updateAccountContact(
        authenticatedAccountId,
        c.req.param("contactId"),
        c.req.valid("json")
      );

      if (!updatedContactResult.ok) {
        if (
          updatedContactResult.error.type === "AccountContactMethodChangeError"
        ) {
          return ProblemJson(
            c,
            409,
            "Contact method cannot be changed",
            `The contact method cannot be changed.`
          );
        }
        if (
          updatedContactResult.error.type === "AccountContactNotAllowedError"
        ) {
          return ProblemJson(
            c,
            403,
            "Forbidden",
            updatedContactResult.error.message
          );
        }

        throw new Error("Unknown error");
      }

      if (!updatedContactResult.value) {
        return ProblemJson(c, 404, "Not found");
      }

      return c.json(ApiObject("contact", updatedContactResult.value));
    }
  )
  .delete("/account/:accountId/contacts/:contactId", withAuth(), async (c) => {
    const requestedAccountId = c.req.param("accountId");
    const authenticatedAccountId = c.get("accountId");

    if (requestedAccountId !== authenticatedAccountId) {
      return ProblemJson(c, 404, "Not found");
    }

    const deletedContactResult = await deleteAccountContact(
      authenticatedAccountId,
      c.req.param("contactId")
    );

    if (!deletedContactResult.ok) {
      if (deletedContactResult.error.type === "AccountContactNotAllowedError") {
        return ProblemJson(
          c,
          403,
          "Forbidden",
          deletedContactResult.error.message
        );
      }
      return ProblemJson(c, 500, "Internal server error");
    }

    if (!deletedContactResult.value) {
      return ProblemJson(c, 404, "Not found");
    }

    return c.newResponse(null, 204);
  });
