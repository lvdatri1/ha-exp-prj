import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlanSelector from "@/components/PlanSelector";

describe("PlanSelector", () => {
  const mockPlans = [
    {
      id: 1,
      retailer: "Mercury",
      name: "Mercury Anytime",
      active: 1,
      is_flat_rate: 1,
      flat_rate: 0.32,
      daily_charge: 0.35,
      has_gas: 0,
      gas_is_flat_rate: 1,
    },
    {
      id: 2,
      retailer: "Contact Energy",
      name: "Contact Energy Basic",
      active: 1,
      is_flat_rate: 0,
      peak_rate: 0.38,
      off_peak_rate: 0.22,
      daily_charge: 0.3,
      has_gas: 1,
      gas_is_flat_rate: 1,
      gas_flat_rate: 0.13,
    },
  ];

  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ plans: mockPlans }),
    });
  });

  it("renders loading state initially", () => {
    render(<PlanSelector selectedPlan={null} onSelect={jest.fn()} />);
    expect(screen.getByText(/loading plans/i)).toBeInTheDocument();
  });

  it("fetches and displays plans", async () => {
    render(<PlanSelector selectedPlan={null} onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/power-plans?active=1");
  });

  it("displays error message on fetch failure", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Failed to load"));

    render(<PlanSelector selectedPlan={null} onSelect={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });

  it("calls onSelect when a plan is selected", async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();

    render(<PlanSelector selectedPlan={null} onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "1");

    expect(onSelect).toHaveBeenCalledWith(mockPlans[0]);
  });

  it("calls onSelect with null when deselecting", async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();

    render(<PlanSelector selectedPlan={mockPlans[0]} onSelect={onSelect} />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "");

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("displays selected plan correctly", async () => {
    render(<PlanSelector selectedPlan={mockPlans[0]} onSelect={jest.fn()} />);

    await waitFor(() => {
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe("1");
    });
  });
});
