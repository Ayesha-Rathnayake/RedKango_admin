import {
  Component,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  HttpErrorResponse,
} from '@angular/common/http';

import { AdminService } from '../../services/admin.service';

import {
  AdminProfile,
  AdminViewModel,
  UpdateAdminProfileRequest,
} from '../../models/admin-profile.model';

import { TermsCondition } from '../../models/terms.model';

type SettingsTab =
  | 'profile'
  | 'security'
  | 'terms'
  | 'site' ;

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl:
    './settings.component.html',
})
export class SettingsComponent
  implements OnInit {

  activeTab: SettingsTab =
    'profile';

  loadingProfile = false;

  savingProfile = false;

  changingPassword = false;

  profileMessage = '';

  profileMessageType:
    | 'success'
    | 'error'
    | '' = '';

  passwordMessage = '';

  passwordMessageType:
    | 'success'
    | 'error'
    | '' = '';

  selectedFile:
    File | null = null;

  previewUrl = '';

  admin: AdminViewModel = {
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    role: 'Admin',
    avatarUrl: '',
    avatarInitial: 'A',
  };

  editAdmin:
    AdminViewModel = {
      ...this.admin,
    };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  showCurrentPassword = false;

  showNewPassword = false;

  showConfirmPassword = false;

  // ================= TERMS =================

  termsLoading = false;

  termsSaving = false;

  termsMessage = '';

  termsMessageType:
    | 'success'
    | 'error'
    | '' = '';

  termsList:
    TermsCondition[] = [];

  termsForm = {
    id: null as number | null,
    title: '',
    version: '',
    content: '',
    active: true,
  };

  constructor(
    private adminService:
      AdminService,

    private cdr:
      ChangeDetectorRef,
  ) {}

  ngOnInit(): void {

    this.loadAdminProfile();

    this.loadTerms();

    this.loadSiteSettings ();
  }

  setTab(
    tab: SettingsTab
  ): void {

    this.activeTab = tab;
  }

  private mapAdminProfile(
    res: AdminProfile
  ): AdminViewModel {

    const firstName =
      res.firstName || '';

    const lastName =
      res.lastName === '-'
        ? ''
        : res.lastName || '';

    const fullName =
      `${firstName} ${lastName}`
        .trim() ||
      res.fullName ||
      'Admin';

    return {
      firstName,

      lastName,

      name: fullName,

      email: res.email || '',

      phone: res.phone || '',

      role: res.role || 'Admin',

      avatarUrl:
        res.profileImageUrl || '',

      avatarInitial:
        fullName
          .charAt(0)
          .toUpperCase() || 'A',
    };
  }

  loadAdminProfile(): void {

    this.loadingProfile = true;

    this.adminService
      .getAdminProfile()
      .subscribe({

        next: (
          res: AdminProfile
        ) => {

          this.admin =
            this.mapAdminProfile(
              res
            );

          this.editAdmin = {
            ...this.admin,
          };

          this.previewUrl =
            this.admin.avatarUrl;

          this.loadingProfile =
            false;

          this.cdr.detectChanges();
        },

        error: () => {

          this.loadingProfile =
            false;

          this.profileMessage =
            'Failed to load profile.';

          this.profileMessageType =
            'error';

          this.cdr.detectChanges();
        },
      });
  }

  onFileSelected(
    event: Event
  ): void {

  const input = event.target as HTMLInputElement;
    const file =
      input.files?.[0];

    if (!file) return;

    this.profileMessage = '';

    this.profileMessageType =
      '';

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {

      this.profileMessage =
        'Please select a valid image file.';

      this.profileMessageType =
        'error';

      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {

      this.profileMessage =
        'Image size should be less than 2MB.';

      this.profileMessageType =
        'error';

      return;
    }

    this.selectedFile = file;

    const reader =
      new FileReader();

    reader.onload = () => {

      this.previewUrl =
        reader.result as string;

      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  removeProfileImage(): void {

    this.previewUrl = '';

    this.selectedFile = null;

    this.editAdmin.avatarUrl =
      '';
  }

  saveProfile(): void {

    this.profileMessage = '';

    this.profileMessageType =
      '';

    if (
      !this.editAdmin.name
        .trim()
    ) {

      this.profileMessage =
        'Name is required.';

      this.profileMessageType =
        'error';

      return;
    }

    if (
      !this.editAdmin.phone
        .trim()
    ) {

      this.profileMessage =
        'Phone number is required.';

      this.profileMessageType =
        'error';

      return;
    }

    this.savingProfile = true;

    const saveToBackend = (
      profileImageUrl: string
    ) => {

      const nameParts =
        this.editAdmin.name
          .trim()
          .split(/\s+/);

      const firstName =
        nameParts[0];

      const lastName =
        nameParts
          .slice(1)
          .join(' ');

      const payload:
        UpdateAdminProfileRequest = {

        firstName,

        lastName,

        phone:
          this.editAdmin.phone
            .trim(),

        profileImageUrl,
      };

      this.adminService
        .updateAdminProfile(
          payload
        )
        .subscribe({

          next: (
            res: AdminProfile
          ) => {

            this.admin =
              this.mapAdminProfile(
                res
              );

            this.editAdmin = {
              ...this.admin,
            };

            this.previewUrl =
              this.admin.avatarUrl;

            this.profileMessage =
              'Profile updated successfully.';

            this.profileMessageType =
              'success';

            this.savingProfile =
              false;

            this.cdr.detectChanges();
          },

          error: (
            err: unknown
          ) => {

            this.profileMessage =
              err instanceof
              HttpErrorResponse
                ? err.error
                    ?.message ||
                  'Profile update failed.'
                : 'Profile update failed.';

            this.profileMessageType =
              'error';

            this.savingProfile =
              false;

            this.cdr.detectChanges();
          },
        });
    };

    if (this.selectedFile) {

      this.adminService
        .uploadFile(
          this.selectedFile
        )
        .subscribe({

          next: (res) =>
            saveToBackend(
              res.url
            ),

          error: () => {

            this.profileMessage =
              'Image upload failed.';

            this.profileMessageType =
              'error';

            this.savingProfile =
              false;

            this.cdr.detectChanges();
          },
        });

    } else {

      saveToBackend(
        this.previewUrl || ''
      );
    }
  }

  updatePassword(): void {

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = this.passwordForm;

    this.passwordMessage = '';

    this.passwordMessageType =
      '';

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {

      this.passwordMessage =
        'Please fill in all password fields.';

      this.passwordMessageType =
        'error';

      return;
    }

    if (
      newPassword.length < 8
    ) {

      this.passwordMessage =
        'New password must be at least 8 characters.';

      this.passwordMessageType =
        'error';

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {

      this.passwordMessage =
        'Passwords do not match.';

      this.passwordMessageType =
        'error';

      return;
    }

    this.changingPassword =
      true;

    this.adminService
      .changePassword(
        this.passwordForm
      )
      .subscribe({

        next: () => {

          this.passwordMessage =
            'Password updated successfully.';

          this.passwordMessageType =
            'success';

          this.changingPassword =
            false;

          this.passwordForm = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          };

          this.cdr.detectChanges();
        },

        error: (
          err: unknown
        ) => {

          this.passwordMessage =
            err instanceof
            HttpErrorResponse
              ? err.error
                  ?.message ||
                'Password change failed.'
              : 'Password change failed.';

          this.passwordMessageType =
            'error';

          this.changingPassword =
            false;

          this.cdr.detectChanges();
        },
      });
  }

  loadTerms(): void {

    this.termsLoading = true;

    this.adminService
      .getTerms()
      .subscribe({

        next: (
          res: TermsCondition[]
        ) => {

          this.termsList =
            res || [];

          this.termsLoading =
            false;

          this.cdr.detectChanges();
        },

        error: () => {

          this.termsMessage =
            'Failed to load terms and conditions.';

          this.termsMessageType =
            'error';

          this.termsLoading =
            false;

          this.cdr.detectChanges();
        },
      });
  }

  saveTerms(): void {

    this.termsMessage = '';

    this.termsMessageType =
      '';

    if (
      !this.termsForm.title
        .trim()
    ) {

      this.termsMessage =
        'Title is required.';

      this.termsMessageType =
        'error';

      return;
    }

    if (
      !this.termsForm.version
        .trim()
    ) {

      this.termsMessage =
        'Version is required.';

      this.termsMessageType =
        'error';

      return;
    }

    if (
      !this.termsForm.content
        .trim()
    ) {

      this.termsMessage =
        'Content is required.';

      this.termsMessageType =
        'error';

      return;
    }

    this.termsSaving = true;

const payload: Partial<TermsCondition> = {
  title: this.termsForm.title,
  version: this.termsForm.version,
  content: this.termsForm.content,
  active: this.termsForm.active,
};

const request =
  this.termsForm.id
    ? this.adminService.updateTerms(
        this.termsForm.id,
        payload
      )
    : this.adminService.createTerms(payload as Omit<
        TermsCondition,
        'id' | 'createdAt' | 'updatedAt'
      >);

    request.subscribe({

      next: () => {

        this.termsMessage =
          this.termsForm.id
            ? 'Terms updated successfully.'
            : 'Terms added successfully.';

        this.termsMessageType =
          'success';

        this.termsSaving =
          false;

        this.resetTermsForm();

        this.loadTerms();
      },

      error: (
        err: unknown
      ) => {

        this.termsMessage =
          err instanceof
          HttpErrorResponse
            ? err.error
                ?.message ||
              'Failed to save terms.'
            : 'Failed to save terms.';

        this.termsMessageType =
          'error';

        this.termsSaving =
          false;

        this.cdr.detectChanges();
      },
    });
  }

  editTerms(
    item: TermsCondition
  ): void {

    this.termsForm = {
      id: item.id,
      title: item.title,
      version: item.version,
      content: item.content,
      active: item.active,
    };

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  deleteTerms(
    id: number
  ): void {

    if (
      !confirm(
        'Are you sure you want to delete these terms?'
      )
    ) {
      return;
    }

    this.adminService
      .deleteTerms(id)
      .subscribe({

        next: () => {

          this.termsMessage =
            'Terms deleted successfully.';

          this.termsMessageType =
            'success';

          this.loadTerms();
        },

        error: () => {

          this.termsMessage =
            'Failed to delete terms.';

          this.termsMessageType =
            'error';
        },
      });
  }

  resetTermsForm(): void {

    this.termsForm = {
      id: null,
      title: '',
      version: '',
      content: '',
      active: true,
    };
  }

    // ================= SITE SETTINGS =================

  siteLoading = false;
  siteSaving = false;
  siteMessage = '';
  siteMessageType: 'success' | 'error' | '' = '';

  siteForm = {
    businessName: '',
    phone: '',
    email: '',
    address: '',
    whatsappNumber: '',
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    tagline: '',
  };

  loadSiteSettings(): void {
    this.siteLoading = true;
    this.adminService.getSiteSettings().subscribe({
      next: (res) => {
        this.siteForm = { ...res };
        this.siteLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.siteLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  saveSiteSettings(): void {
    this.siteMessage = '';
    this.siteMessageType = '';
    this.siteSaving = true;

    this.adminService.updateSiteSettings(this.siteForm).subscribe({
      next: () => {
        this.siteMessage = 'Site settings saved successfully.';
        this.siteMessageType = 'success';
        this.siteSaving = false;
        this.cdr.detectChanges();
        setTimeout(() => { this.siteMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => {
        this.siteMessage = 'Failed to save site settings.';
        this.siteMessageType = 'error';
        this.siteSaving = false;
        this.cdr.detectChanges();
      },
    });
  }

}