import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Settings, Database, Bell, Shield, Clock, Users } from "lucide-react"

export function SettingsPage() {
  const [notifications, setNotifications] = useState({
    vacancyAlerts: true,
    assignmentChanges: true,
    holdDownUpdates: false,
    systemMaintenance: true
  })

  const [preferences, setPreferences] = useState({
    autoRefresh: true,
    showHolidayWarnings: true,
    enableTrainerValidation: true,
    requireQualificationNotes: false
  })

  const systemInfo = {
    version: "1.1.0",
    lastUpdate: "2025-01-21",
    database: "PostgreSQL 15+",
    environment: "Production"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure system preferences and notifications
          </p>
        </div>
        <Badge variant="secondary">Norfolk Southern NOC</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="vacancy-alerts">Vacancy Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new vacancies are detected
                </p>
              </div>
              <Switch
                id="vacancy-alerts"
                checked={notifications.vacancyAlerts}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, vacancyAlerts: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="assignment-changes">Assignment Changes</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications for assignment modifications
                </p>
              </div>
              <Switch
                id="assignment-changes"
                checked={notifications.assignmentChanges}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, assignmentChanges: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="hold-down-updates">Hold-Down Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Updates on hold-down status changes
                </p>
              </div>
              <Switch
                id="hold-down-updates"
                checked={notifications.holdDownUpdates}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, holdDownUpdates: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="system-maintenance">System Maintenance</Label>
                <p className="text-sm text-muted-foreground">
                  Alerts for scheduled maintenance windows
                </p>
              </div>
              <Switch
                id="system-maintenance"
                checked={notifications.systemMaintenance}
                onCheckedChange={(checked) => 
                  setNotifications({ ...notifications, systemMaintenance: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* System Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>System Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-refresh">Auto Refresh</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically refresh schedule data
                </p>
              </div>
              <Switch
                id="auto-refresh"
                checked={preferences.autoRefresh}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, autoRefresh: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="holiday-warnings">Holiday Warnings</Label>
                <p className="text-sm text-muted-foreground">
                  Show warnings for holiday assignments
                </p>
              </div>
              <Switch
                id="holiday-warnings"
                checked={preferences.showHolidayWarnings}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, showHolidayWarnings: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="trainer-validation">Trainer Validation</Label>
                <p className="text-sm text-muted-foreground">
                  Enforce trainer requirements for new dispatchers
                </p>
              </div>
              <Switch
                id="trainer-validation"
                checked={preferences.enableTrainerValidation}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, enableTrainerValidation: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="qualification-notes">Qualification Notes</Label>
                <p className="text-sm text-muted-foreground">
                  Require notes for all qualifications
                </p>
              </div>
              <Switch
                id="qualification-notes"
                checked={preferences.requireQualificationNotes}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, requireQualificationNotes: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security & Access</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Audit Retention</Label>
                <p className="text-lg font-semibold">90 days</p>
                <p className="text-xs text-muted-foreground">
                  Audit logs are retained for compliance
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Session Timeout</Label>
                <p className="text-lg font-semibold">8 hours</p>
                <p className="text-xs text-muted-foreground">
                  Auto logout after inactivity
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Data Protection</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">Active</Badge>
                  <span>Row-Level Security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">Active</Badge>
                  <span>Encrypted Storage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">Active</Badge>
                  <span>Audit Logging</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default" className="text-xs">Active</Badge>
                  <span>Access Controls</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>System Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Version</Label>
                <p className="text-lg font-semibold">{systemInfo.version}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Environment</Label>
                <Badge variant="default">{systemInfo.environment}</Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Update</Label>
                <p className="text-sm">{systemInfo.lastUpdate}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Database</Label>
                <p className="text-sm">{systemInfo.database}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Features</Label>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Desk Scheduling</span>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dispatcher Management</span>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Vacancy Detection</span>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hold-Down Management</span>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>ATW Scheduling (Around The World)</span>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">2</div>
              <p className="text-sm text-muted-foreground">Active Desks</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">6</div>
              <p className="text-sm text-muted-foreground">Total Tricks</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">3</div>
              <p className="text-sm text-muted-foreground">Active Dispatchers</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">98.5%</div>
              <p className="text-sm text-muted-foreground">Coverage Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}