import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

export async function generateMetadata() {
  const t = await getTranslations("metadata");

  return {
    title: t("privacy.title"),
    description: t("privacy.description"),
    keywords: t("privacy.keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      title: t("privacy.title"),
      description: t("privacy.description"),
      url: "https://alojamentoideal.com/privacy",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("privacy.title"),
      description: t("privacy.description"),
    },
  };
}

export default function Home({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const { locale } = use<{ locale: string }>(params);
  setRequestLocale(locale);
  const t = useTranslations("privacy");
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16 sm:pt-12 pt-6">
      <div className="w-full relative flex flex-col text-left max-w-5xl mx-auto gap-4 px-4">
        <h1 className="lg:text-4xl md:text-3xl sm:text-2xl text-xl font-bold">
          {t("privacy")}{" "}
        </h1>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t("last-updated-privacy")}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t("pp-p-1")}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t("pp-p-2")}{" "}
        </p>
        <h2 className="lg:text-3xl md:text-2xl sm:text-xl text-lg font-semibold">
          {t("pp-p-3")}{" "}
        </h2>
        <h3 className="lg:text-2xl md:text-lg sm:text-base text-sm font-medium">
          {t("pp-h3")}{" "}
        </h3>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t("pp-p-4")}{" "}
        </p>
        <h3 className="lg:text-2xl md:text-lg sm:text-base text-sm font-medium">
          {t("pp-h3-2")}{" "}
        </h3>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t("pp-p-5")}{" "}
        </p>
        <ul className="list-disc pl-8">
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("account")}</strong>{" "}
              {t(
                "means-a-unique-account-created-for-you-to-access-our-service-or-parts-of-our-service"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("affiliate")}</strong>{" "}
              {t(
                "means-an-entity-that-controls-is-controlled-by-or-is-under-common-control-with-a-party-where-and-quot-control-and-quot-means-ownership-of-50-or-more-of-the-shares-equity-interest-or-other-securities-entitled-to-vote-for-election-of-directors-or-other-managing-authority"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("company")}</strong>{" "}
              {t(
                "referred-to-as-either-and-quot-the-company-and-quot-and-quot-we-and-quot-and-quot-us-and-quot-or-and-quot-our-and-quot-in-this-agreement-refers-to-relevos-inalcancaveis-lda-rua-antonio-ramalho-171-4460-241-senhora-da-hora"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("cookies")}</strong>{" "}
              {t(
                "are-small-files-that-are-placed-on-your-computer-mobile-device-or-any-other-device-by-a-website-containing-the-details-of-your-browsing-history-on-that-website-among-its-many-uses"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("country")}</strong> {t("refers-to-portugal")}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("device")}</strong>{" "}
              {t(
                "means-any-device-that-can-access-the-service-such-as-a-computer-a-cellphone-or-a-digital-tablet"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("personal-data")}</strong>{" "}
              {t(
                "is-any-information-that-relates-to-an-identified-or-identifiable-individual"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("service")}</strong> {t("refers-to-the-website")}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("service-provider")}</strong>{" "}
              {t(
                "means-any-natural-or-legal-person-who-processes-the-data-on-behalf-of-the-company-it-refers-to-third-party-companies-or-individuals-employed-by-the-company-to-facilitate-the-service-to-provide-the-service-on-behalf-of-the-company-to-perform-services-related-to-the-service-or-to-assist-the-company-in-analyzing-how-the-service-is-used"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("usage-data")}</strong>{" "}
              {t(
                "refers-to-data-collected-automatically-either-generated-by-the-use-of-the-service-or-from-the-service-infrastructure-itself-for-example-the-duration-of-a-page-visit"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("website")}</strong>{" "}
              {t("refers-to-alojamento-ideal-accessible-from")}m{" "}
              <a
                href="https://www.alojamentoideal.pt"
                rel={"external nofollow noopener"}
                target="_blank"
              >
                https://www.alojamentoideal.pt
              </a>
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("you")}</strong>{" "}
              {t(
                "means-the-individual-accessing-or-using-the-service-or-the-company-or-other-legal-entity-on-behalf-of-which-such-individual-is-accessing-or-using-the-service-as-applicable"
              )}{" "}
            </p>
          </li>
        </ul>
        <h2 className="lg:text-3xl md:text-2xl sm:text-xl text-lg font-semibold">
          {t("collecting-and-using-your-personal-data")}{" "}
        </h2>
        <h3 className="lg:text-2xl md:text-lg sm:text-base text-sm font-medium">
          {t("types-of-data-collected")}{" "}
        </h3>
        <h4>{t("personal-data-0")}</h4>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "while-using-our-service-we-may-ask-you-to-provide-us-with-certain-personally-identifiable-information-that-can-be-used-to-contact-or-identify-you-personally-identifiable-information-may-include-but-is-not-limited-to"
          )}{" "}
        </p>
        <ul className="list-disc pl-8">
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t("email-address")}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t("first-name-and-last-name")}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t("phone-number")}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t("usage-data-0")}{" "}
            </p>
          </li>
        </ul>
        <h4>{t("usage-data-1")}</h4>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t("usage-data-is-collected-automatically-when-using-the-service")}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "usage-data-may-include-information-such-as-your-devices-internet-protocol-address-e-g-ip-address-browser-type-browser-version-the-pages-of-our-service-that-you-visit-the-time-and-date-of-your-visit-the-time-spent-on-those-pages-unique-device-identifiers-and-other-diagnostic-data"
          )}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "when-you-access-the-service-by-or-through-a-mobile-device-we-may-collect-certain-information-automatically-including-but-not-limited-to-the-type-of-mobile-device-you-use-your-mobile-device-unique-id-the-ip-address-of-your-mobile-device-your-mobile-operating-system-the-type-of-mobile-internet-browser-you-use-unique-device-identifiers-and-other-diagnostic-data"
          )}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "we-may-also-collect-information-that-your-browser-sends-whenever-you-visit-our-service-or-when-you-access-the-service-by-or-through-a-mobile-device"
          )}{" "}
        </p>
        <h4>{t("tracking-technologies-and-cookies")}</h4>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "we-use-cookies-and-similar-tracking-technologies-to-track-the-activity-on-our-service-and-store-certain-information-tracking-technologies-used-are-beacons-tags-and-scripts-to-collect-and-track-information-and-to-improve-and-analyze-our-service-the-technologies-we-use-may-include"
          )}{" "}
        </p>
        <ul className="list-disc pl-8">
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("cookies-or-browser-cookies")}</strong>{" "}
              {t(
                "a-cookie-is-a-small-file-placed-on-your-device-you-can-instruct-your-browser-to-refuse-all-cookies-or-to-indicate-when-a-cookie-is-being-sent-however-if-you-do-not-accept-cookies-you-may-not-be-able-to-use-some-parts-of-our-service-unless-you-have-adjusted-your-browser-setting-so-that-it-will-refuse-cookies-our-service-may-use-cookies"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("web-beacons")}</strong>{" "}
              {t(
                "certain-sections-of-our-service-and-our-emails-may-contain-small-electronic-files-known-as-web-beacons-also-referred-to-as-clear-gifs-pixel-tags-and-single-pixel-gifs-that-permit-the-company-for-example-to-count-users-who-have-visited-those-pages-or-opened-an-email-and-for-other-related-website-statistics-for-example-recording-the-popularity-of-a-certain-section-and-verifying-system-and-server-integrity"
              )}{" "}
            </p>
          </li>
        </ul>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "cookies-can-be-and-quot-persistent-and-quot-or-and-quot-session-and-quot-cookies-persistent-cookies-remain-on-your-personal-computer-or-mobile-device-when-you-go-offline-while-session-cookies-are-deleted-as-soon-as-you-close-your-web-browser"
          )}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "we-use-both-session-and-persistent-cookies-for-the-purposes-set-out-below"
          )}{" "}
        </p>
        <ul className="list-disc pl-8">
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("necessary-essential-cookies")}</strong>
            </p>
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t("type-session-cookies")}{" "}
            </p>
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t("administered-by-us")}{" "}
            </p>
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t(
                "purpose-these-cookies-are-essential-to-provide-you-with-services-available-through-the-website-and-to-enable-you-to-use-some-of-its-features-they-help-to-authenticate-users-and-prevent-fraudulent-use-of-user-accounts-without-these-cookies-the-services-that-you-have-asked-for-cannot-be-provided-and-we-only-use-these-cookies-to-provide-you-with-those-services"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("cookies-policy-notice-acceptance-cookies")}</strong>
            </p>
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t("type-persistent-cookies")}{" "}
            </p>
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t("administered-by-us-0")}{" "}
            </p>
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t(
                "purpose-these-cookies-identify-if-users-have-accepted-the-use-of-cookies-on-the-website"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("functionality-cookies")}</strong>
            </p>
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t("type-persistent-cookies-0")}{" "}
            </p>
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t("administered-by-us-1")}{" "}
            </p>
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t(
                "purpose-these-cookies-allow-us-to-remember-choices-you-make-when-you-use-the-website-such-as-remembering-your-login-details-or-language-preference-the-purpose-of-these-cookies-is-to-provide-you-with-a-more-personal-experience-and-to-avoid-you-having-to-re-enter-your-preferences-every-time-you-use-the-website"
              )}{" "}
            </p>
          </li>
        </ul>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "for-more-information-about-the-cookies-we-use-and-your-choices-regarding-cookies-please-visit-our-cookies-policy-or-the-cookies-section-of-our-privacy-policy"
          )}{" "}
        </p>
        <h3 className="lg:text-2xl md:text-lg sm:text-base text-sm font-medium">
          {t("use-of-your-personal-data")}{" "}
        </h3>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t("the-company-may-use-personal-data-for-the-following-purposes")}{" "}
        </p>
        <ul className="list-disc pl-8">
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("to-provide-and-maintain-our-service")}</strong>
              {t("including-to-monitor-the-usage-of-our-service")}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("to-manage-your-account")}</strong>{" "}
              {t(
                "to-manage-your-registration-as-a-user-of-the-service-the-personal-data-you-provide-can-give-you-access-to-different-functionalities-of-the-service-that-are-available-to-you-as-a-registered-user"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("for-the-performance-of-a-contract")}</strong>{" "}
              {t(
                "the-development-compliance-and-undertaking-of-the-purchase-contract-for-the-products-items-or-services-you-have-purchased-or-of-any-other-contract-with-us-through-the-service"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("to-contact-you")}</strong>{" "}
              {t(
                "to-contact-you-by-email-telephone-calls-sms-or-other-equivalent-forms-of-electronic-communication-such-as-a-mobile-applications-push-notifications-regarding-updates-or-informative-communications-related-to-the-functionalities-products-or-contracted-services-including-the-security-updates-when-necessary-or-reasonable-for-their-implementation"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("to-provide-you")}</strong>{" "}
              {t(
                "with-news-special-offers-and-general-information-about-other-goods-services-and-events-which-we-offer-that-are-similar-to-those-that-you-have-already-purchased-or-enquired-about-unless-you-have-opted-not-to-receive-such-information"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("to-manage-your-requests")}</strong>{" "}
              {t("to-attend-and-manage-your-requests-to-us")}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("for-business-transfers")}</strong>{" "}
              {t(
                "we-may-use-your-information-to-evaluate-or-conduct-a-merger-divestiture-restructuring-reorganization-dissolution-or-other-sale-or-transfer-of-some-or-all-of-our-assets-whether-as-a-going-concern-or-as-part-of-bankruptcy-liquidation-or-similar-proceeding-in-which-personal-data-held-by-us-about-our-service-users-is-among-the-assets-transferred"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("for-other-purposes")}</strong>
              {t(
                "we-may-use-your-information-for-other-purposes-such-as-data-analysis-identifying-usage-trends-determining-the-effectiveness-of-our-promotional-campaigns-and-to-evaluate-and-improve-our-service-products-services-marketing-and-your-experience"
              )}{" "}
            </p>
          </li>
        </ul>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "we-may-share-your-personal-information-in-the-following-situations"
          )}{" "}
        </p>
        <ul className="list-disc pl-8">
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("with-service-providers")}</strong>{" "}
              {t(
                "we-may-share-your-personal-information-with-service-providers-to-monitor-and-analyze-the-use-of-our-service-to-contact-you"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("for-business-transfers-0")}</strong>{" "}
              {t(
                "we-may-share-or-transfer-your-personal-information-in-connection-with-or-during-negotiations-of-any-merger-sale-of-company-assets-financing-or-acquisition-of-all-or-a-portion-of-our-business-to-another-company"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("with-affiliates")}</strong>{" "}
              {t(
                "we-may-share-your-information-with-our-affiliates-in-which-case-we-will-require-those-affiliates-to-honor-this-privacy-policy-affiliates-include-our-parent-company-and-any-other-subsidiaries-joint-venture-partners-or-other-companies-that-we-control-or-that-are-under-common-control-with-us"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("with-business-partners")}</strong>{" "}
              {t(
                "we-may-share-your-information-with-our-business-partners-to-offer-you-certain-products-services-or-promotions"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("with-other-users")}</strong>{" "}
              {t(
                "when-you-share-personal-information-or-otherwise-interact-in-the-public-areas-with-other-users-such-information-may-be-viewed-by-all-users-and-may-be-publicly-distributed-outside"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              <strong>{t("with-your-consent")}</strong>
              {t(
                "we-may-disclose-your-personal-information-for-any-other-purpose-with-your-consent"
              )}{" "}
            </p>
          </li>
        </ul>
        <h3 className="lg:text-2xl md:text-lg sm:text-base text-sm font-medium">
          {t("retention-of-your-personal-data")}{" "}
        </h3>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "the-company-will-retain-your-personal-data-only-for-as-long-as-is-necessary-for-the-purposes-set-out-in-this-privacy-policy-we-will-retain-and-use-your-personal-data-to-the-extent-necessary-to-comply-with-our-legal-obligations-for-example-if-we-are-required-to-retain-your-data-to-comply-with-applicable-laws-resolve-disputes-and-enforce-our-legal-agreements-and-policies"
          )}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "the-company-will-also-retain-usage-data-for-internal-analysis-purposes-usage-data-is-generally-retained-for-a-shorter-period-of-time-except-when-this-data-is-used-to-strengthen-the-security-or-to-improve-the-functionality-of-our-service-or-we-are-legally-obligated-to-retain-this-data-for-longer-time-periods"
          )}{" "}
        </p>
        <h3 className="lg:text-2xl md:text-lg sm:text-base text-sm font-medium">
          {t("transfer-of-your-personal-data")}{" "}
        </h3>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "your-information-including-personal-data-is-processed-at-the-companys-operating-offices-and-in-any-other-places-where-the-parties-involved-in-the-processing-are-located-it-means-that-this-information-may-be-transferred-to-and-maintained-on-computers-located-outside-of-your-state-province-country-or-other-governmental-jurisdiction-where-the-data-protection-laws-may-differ-than-those-from-your-jurisdiction"
          )}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "your-consent-to-this-privacy-policy-followed-by-your-submission-of-such-information-represents-your-agreement-to-that-transfer"
          )}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "the-company-will-take-all-steps-reasonably-necessary-to-ensure-that-your-data-is-treated-securely-and-in-accordance-with-this-privacy-policy-and-no-transfer-of-your-personal-data-will-take-place-to-an-organization-or-a-country-unless-there-are-adequate-controls-in-place-including-the-security-of-your-data-and-other-personal-information"
          )}{" "}
        </p>
        <h3 className="lg:text-2xl md:text-lg sm:text-base text-sm font-medium">
          {t("delete-your-personal-data")}{" "}
        </h3>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "you-have-the-right-to-delete-or-request-that-we-assist-in-deleting-the-personal-data-that-we-have-collected-about-you"
          )}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "our-service-may-give-you-the-ability-to-delete-certain-information-about-you-from-within-the-service"
          )}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "you-may-update-amend-or-delete-your-information-at-any-time-by-signing-in-to-your-account-if-you-have-one-and-visiting-the-account-settings-section-that-allows-you-to-manage-your-personal-information-you-may-also-contact-us-to-request-access-to-correct-or-delete-any-personal-information-that-you-have-provided-to-us"
          )}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "please-note-however-that-we-may-need-to-retain-certain-information-when-we-have-a-legal-obligation-or-lawful-basis-to-do-so"
          )}{" "}
        </p>
        <h3 className="lg:text-2xl md:text-lg sm:text-base text-sm font-medium">
          {t("disclosure-of-your-personal-data")}{" "}
        </h3>
        <h4>{t("business-transactions")}</h4>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "if-the-company-is-involved-in-a-merger-acquisition-or-asset-sale-your-personal-data-may-be-transferred-we-will-provide-notice-before-your-personal-data-is-transferred-and-becomes-subject-to-a-different-privacy-policy"
          )}{" "}
        </p>
        <h4>{t("law-enforcement")}</h4>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "under-certain-circumstances-the-company-may-be-required-to-disclose-your-personal-data-if-required-to-do-so-by-law-or-in-response-to-valid-requests-by-public-authorities-e-g-a-court-or-a-government-agency"
          )}{" "}
        </p>
        <h4>{t("other-legal-requirements")}</h4>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "the-company-may-disclose-your-personal-data-in-the-good-faith-belief-that-such-action-is-necessary-to"
          )}{" "}
        </p>
        <ul className="list-disc pl-8">
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t("comply-with-a-legal-obligation")}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t("protect-and-defend-the-rights-or-property-of-the-company")}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t(
                "prevent-or-investigate-possible-wrongdoing-in-connection-with-the-service"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t(
                "protect-the-personal-safety-of-users-of-the-service-or-the-public"
              )}{" "}
            </p>
          </li>
          <li className="">
            <p className="lg:text-lg md:text-base sm:text-sm text-xs">
              {t("protect-against-legal-liability")}{" "}
            </p>
          </li>
        </ul>
        <h3 className="lg:text-2xl md:text-lg sm:text-base text-sm font-medium">
          {t("security-of-your-personal-data")}{" "}
        </h3>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "the-security-of-your-personal-data-is-important-to-us-but-remember-that-no-method-of-transmission-over-the-internet-or-method-of-electronic-storage-is-100-secure-while-we-strive-to-use-commercially-acceptable-means-to-protect-your-personal-data-we-cannot-guarantee-its-absolute-security"
          )}{" "}
        </p>
        <h2 className="lg:text-3xl md:text-2xl sm:text-xl text-lg font-semibold">
          {t("childrens-privacy")}{" "}
        </h2>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "our-service-does-not-address-anyone-under-the-age-of-13-we-do-not-knowingly-collect-personally-identifiable-information-from-anyone-under-the-age-of-13-if-you-are-a-parent-or-guardian-and-you-are-aware-that-your-child-has-provided-us-with-personal-data-please-contact-us-if-we-become-aware-that-we-have-collected-personal-data-from-anyone-under-the-age-of-13-without-verification-of-parental-consent-we-take-steps-to-remove-that-information-from-our-servers"
          )}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "if-we-need-to-rely-on-consent-as-a-legal-basis-for-processing-your-information-and-your-country-requires-consent-from-a-parent-we-may-require-your-parents-consent-before-we-collect-and-use-that-information"
          )}{" "}
        </p>
        <h2 className="lg:text-3xl md:text-2xl sm:text-xl text-lg font-semibold">
          {t("links-to-other-websites")}{" "}
        </h2>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "our-service-may-contain-links-to-other-websites-that-are-not-operated-by-us-if-you-click-on-a-third-party-link-you-will-be-directed-to-that-third-partys-site-we-strongly-advise-you-to-review-the-privacy-policy-of-every-site-you-visit"
          )}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "we-have-no-control-over-and-assume-no-responsibility-for-the-content-privacy-policies-or-practices-of-any-third-party-sites-or-services"
          )}{" "}
        </p>
        <h2 className="lg:text-3xl md:text-2xl sm:text-xl text-lg font-semibold">
          {t("changes-to-this-privacy-policy")}{" "}
        </h2>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "we-may-update-our-privacy-policy-from-time-to-time-we-will-notify-you-of-any-changes-by-posting-the-new-privacy-policy-on-this-page"
          )}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "we-will-let-you-know-via-email-and-or-a-prominent-notice-on-our-service-prior-to-the-change-becoming-effective-and-update-the-and-quot-last-updated-and-quot-date-at-the-top-of-this-privacy-policy"
          )}{" "}
        </p>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "you-are-advised-to-review-this-privacy-policy-periodically-for-any-changes-changes-to-this-privacy-policy-are-effective-when-they-are-posted-on-this-page"
          )}{" "}
        </p>
        <h2 className="lg:text-3xl md:text-2xl sm:text-xl text-lg font-semibold">
          {t("contact")}{" "}
        </h2>
        <p className="lg:text-lg md:text-base sm:text-sm text-xs">
          {t(
            "if-you-have-any-questions-about-this-privacy-policy-you-can-contact-us"
          )}{" "}
        </p>
        <ul className="list-disc pl-8">
          <li className="lg:text-lg md:text-base sm:text-sm text-xs">
            {t("by-visiting-this-page-on-our-website")}:{" "}
            <a
              href="https://www.alojamentoideal.pt/help"
              rel={"external nofollow noopener"}
              target="_blank"
              className="font-semibold underline"
            >
              https://www.alojamentoideal.pt/help
            </a>
          </li>
        </ul>
      </div>
    </main>
  );
}
