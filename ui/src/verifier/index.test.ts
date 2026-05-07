import { Verifier } from "./index";
import { shopListings, type ShopListing } from "../constants/shop";

const platformUrl = "https://invers-technology.github.io/right-to-sell-proof";

const getRouteLid = (route: ShopListing) =>
  `${platformUrl}/shop/${route.shopId}/item/${route.itemId}?localte=${route.locale}&category=${route.category}`;

describe("Verifier", () => {
  it("verifies a valid proof", async () => {
    const route = shopListings[0];
    const { proof, publicKey, root } = await Verifier.decodeProof(route.proof);
    const publicSignals = Verifier.encodePublicInputs(
      BigInt(root),
      getRouteLid(route),
      publicKey,
    );
    const verificationKey = await Verifier.getVerificationKey();
    const verifier = new Verifier(verificationKey);

    await expect(verifier.verify(proof, publicSignals)).resolves.toBe(true);
  });
});
