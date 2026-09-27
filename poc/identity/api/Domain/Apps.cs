namespace SportSeek.Identity.Api.Domain;

public static class Roles
{
    public const string Player = "Player";
    public const string EventOrganiser = "EventOrganiser";
    public const string FacilityPartner = "FacilityPartner";
    public const string Coach = "Coach";
    public const string Physio = "Physio";
    public const string Nutritionist = "Nutritionist";
    public const string Admin = "Admin";

    public static readonly string[] All = [Player, EventOrganiser, FacilityPartner, Coach, Physio, Nutritionist, Admin];
}

/// <summary>
/// Each app is its own OIDC client (TA §6.1). A client may only grant, and only puts into its
/// tokens, the roles that belong to that app. There is no session sharing between apps.
/// </summary>
public sealed record AppClient(string ClientId, string DisplayName, string DefaultRole, string[] AllowedRoles, bool GatedByF3);

public static class Apps
{
    public const string UserApp = "user-app";
    public const string PartnerApp = "partner-app";
    public const string AdminPortal = "admin-portal";

    public static readonly AppClient[] All =
    [
        new(UserApp, "SportSeek User App", Roles.Player, [Roles.Player, Roles.EventOrganiser], GatedByF3: true),
        new(PartnerApp, "SportSeek Partner App", Roles.FacilityPartner,
            [Roles.FacilityPartner, Roles.Coach, Roles.Physio, Roles.Nutritionist], GatedByF3: true),
        new(AdminPortal, "SportSeek Admin Portal", Roles.Admin, [Roles.Admin], GatedByF3: false),
    ];

    public static AppClient? Find(string? clientId) => All.FirstOrDefault(a => a.ClientId == clientId);
}
