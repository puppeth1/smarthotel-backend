export interface HotelSettings {
  hotelId: string;

  identity: {
    name: string;
    displayName?: string;
    logoUrl?: string;
  };

  address: {
    line: string;
    city: string;
    state: string;
    pincode: string;
  };

  contact: {
    phone: string;
    email: string;
  };

  tax: {
    gstNumber?: string;
    gstPercent: number;
  };

  invoice: {
    prefix: string;
    footerText: string;
  };

  updatedAt: string;
}
