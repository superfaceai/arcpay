import { Layout } from "@/components/Layout";
import { FC } from "hono/jsx";

export const ConfirmPhoneNumber: FC = () => {
  return (
    <Layout>
      <h1>Confirm Phone Number</h1>
      <p>A confirmation code has been sent to your phone number.</p>
      <form id="confirm-phone-form" method="post" action="/confirm-phone">
        <div class="form-field">
          <label for="code">Confirmation Code</label>
          <input type="number" id="code" name="code" required />
        </div>

        <button type="submit">Confirm Phone Number</button>
      </form>
    </Layout>
  );
};
