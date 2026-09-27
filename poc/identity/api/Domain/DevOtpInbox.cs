using System.Collections.Concurrent;

namespace SportSeek.Identity.Api.Domain;

public sealed record DevOtpMessage(DateTimeOffset At, string Channel, string To, string Client, string Code, string Text);

/// <summary>
/// POC stand-in for the SMS/email provider: OTPs are held in memory and shown in the apps' "Dev SMS
/// inbox" and the API console. Registered only in the Development environment. Production sends
/// through the DLT-registered SMS provider and never exposes codes.
/// </summary>
public class DevOtpInbox
{
    private readonly ConcurrentQueue<DevOtpMessage> _messages = new();

    public void Add(DevOtpMessage message)
    {
        _messages.Enqueue(message);
        while (_messages.Count > 50) _messages.TryDequeue(out _);
    }

    public IReadOnlyList<DevOtpMessage> Latest(int take = 20) => _messages.Reverse().Take(take).ToList();

    public void Clear() => _messages.Clear();
}
