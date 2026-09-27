using PhoneNumbers;

namespace SportSeek.Identity.Api.Domain;

public sealed record NormalisedIdentifier(string Type, string Value)
{
    public string Masked => Type == "phone"
        ? Value[..3] + new string('•', Math.Max(0, Value.Length - 7)) + Value[^4..]
        : Value[..1] + "•••" + Value[Value.IndexOf('@')..];
}

/// <summary>Phones to E.164 (default region India), emails trimmed and lower-cased.</summary>
public static class Identifiers
{
    private static readonly PhoneNumberUtil Phones = PhoneNumberUtil.GetInstance();

    public static NormalisedIdentifier? TryNormalise(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        raw = raw.Trim();

        if (raw.Contains('@'))
        {
            var email = raw.ToLowerInvariant();
            var at = email.IndexOf('@');
            return at > 0 && at < email.Length - 3 && email.IndexOf('.', at) > at ? new("email", email) : null;
        }

        try
        {
            var number = Phones.Parse(raw, "IN");
            return Phones.IsValidNumber(number)
                ? new("phone", Phones.Format(number, PhoneNumberFormat.E164))
                : null;
        }
        catch (NumberParseException)
        {
            return null;
        }
    }
}
